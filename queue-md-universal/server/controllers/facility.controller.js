const Facility = require("../models/Facility");
const { z } = require("zod");
const logger = require("../utils/logger");

// Validation Schema
const facilitySchema = z.object({
  name: z.string().min(2, "Facility name required"),
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]),
  address: z.string().optional(),
  contact: z.string().optional(),
  customFields: z.record(z.any()).optional()
});

// ✅ CREATE FACILITY
exports.createFacility = async (req, res, next) => {
  try {
    const validation = facilitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: validation.error.errors
      });
    }

    const facility = await Facility.create(validation.data);
    logger.info(`New Facility Created: ${facility.name} (${facility.facilityType})`);

    res.status(201).json({
      success: true,
      data: facility,
      message: "Facility registered successfully"
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET ALL FACILITIES (Optional filter by type)
exports.getFacilities = async (req, res, next) => {
  try {
    const { facilityType } = req.query;
    const query = facilityType ? { facilityType, isActive: true } : { isActive: true };

    const facilities = await Facility.find(query).select("name facilityType _id");

    res.json({
      success: true,
      count: facilities.length,
      facilities
    });
  } catch (err) {
    next(err);
  }
};

// ✅ ADD BRANCH
exports.addBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id !== req.user.facilityId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this facility" });
    }

    const { name, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Branch name required" });

    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    facility.branches.push({ name, address, isActive: true });
    await facility.save();

    res.json({ success: true, data: facility.branches, message: "Branch added successfully" });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE BRANCH
exports.updateBranch = async (req, res, next) => {
  try {
    const { id, branchId } = req.params;
    if (id !== req.user.facilityId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { name, address, isActive } = req.body;
    
    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    const branch = facility.branches.id(branchId);
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

    if (name !== undefined) branch.name = name;
    if (address !== undefined) branch.address = address;
    if (isActive !== undefined) branch.isActive = isActive;

    await facility.save();
    res.json({ success: true, data: facility.branches, message: "Branch updated" });
  } catch (err) {
    next(err);
  }
};

// ✅ GET BRANCHES
exports.getBranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facility = await Facility.findById(id).select("branches");
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    res.json({ success: true, data: facility.branches });
  } catch (err) {
    next(err);
  }
};

// ✅ GET CURRENT FACILITY
exports.getMyFacility = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE FACILITY DETAILS
exports.updateFacility = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    const allowedSchemaFields = ["name", "address", "contact", "logo", "workingHours"];
    const updates = req.body;

    // Check if name is being updated and validated
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: "Facility name must be at least 2 characters" });
    }

    for (const key of Object.keys(updates)) {
      if (key === "facilityId" || key === "_id") continue;
      if (allowedSchemaFields.includes(key)) {
        facility[key] = updates[key];
      } else {
        // Save dynamically into customFields Map
        if (!facility.customFields) {
          facility.customFields = new Map();
        }
        facility.customFields.set(key, updates[key]);
      }
    }

    await facility.save();
    logger.info(`Facility updated: ${facility.name} (ID: ${facility._id})`);

    res.json({
      success: true,
      data: facility,
      message: "Facility settings updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GENERATE LOBBY QR
const QRCode = require('qrcode');

exports.generateLobbyQR = async (req, res, next) => {
    try {
        const { facilityId } = req.user;
        
        // This URL points to the frontend lobby portal route
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const lobbyUrl = `${clientUrl}/lobby/${facilityId}`;
        
        const qrImage = await QRCode.toDataURL(lobbyUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: { dark: '#2563EB', light: '#FFFFFF' }
        });

        const facility = await Facility.findByIdAndUpdate(
            facilityId, 
            { lobbyQrCode: qrImage },
            { new: true }
        );

        res.status(200).json({ success: true, qrImage: facility.lobbyQrCode });
    } catch (error) {
        logger.error(`QR Generation failed for facility ${req.user?.facilityId}: ${error.message}`);
        res.status(500).json({ success: false, message: "QR Generation failed" });
    }
};

// ✅ COMPLETE ONBOARDING STEP
exports.completeOnboardingStep = async (req, res, next) => {
    try {
        const { step, facilityType, staffName, staffPhone, staffEmail, staffPassword, addDummyPatient } = req.body;
        const facilityId = req.user.facilityId;

        const facility = await Facility.findById(facilityId);
        if (!facility) {
            return res.status(404).json({ success: false, message: "Facility not found" });
        }

        const updateData = {};
        let newAccessToken = null;

        // Step 1: Update Facility Type
        if (step === 2 && facilityType) {
            const allowedTypes = ["clinic", "hospital", "pathlab", "dental", "physio", "other"];
            if (!allowedTypes.includes(facilityType)) {
                return res.status(400).json({ success: false, message: "Invalid facility type" });
            }
            updateData.facilityType = facilityType;
            updateData.onboardingStep = 2;

            // Update admin user facilityType in database
            const User = require("../models/User");
            await User.findByIdAndUpdate(req.user.id, { facilityType });

            // Sign a fresh JWT access token with the updated facilityType
            const jwt = require("jsonwebtoken");
            newAccessToken = jwt.sign(
                { id: req.user.id, facilityId: facilityId, facilityType: facilityType, role: req.user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '15m' }
            );
        }

        // Step 2: Create Receptionist User
        if (step === 3 && staffEmail) {
            if (!staffName || !staffPhone || !staffEmail || !staffPassword) {
                return res.status(400).json({ success: false, message: "All staff details (name, phone, email, password) are required" });
            }

            // Check if user already exists
            const User = require("../models/User");
            const userExists = await User.findOne({ email: staffEmail.toLowerCase() });
            if (userExists) {
                return res.status(400).json({ success: false, message: "A user with this email already exists" });
            }

            const bcrypt = require("bcryptjs");
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
            const hashedPassword = await bcrypt.hash(staffPassword, saltRounds);

            // Create receptionist user
            await User.create({
                name: staffName,
                email: staffEmail.toLowerCase(),
                password: hashedPassword,
                role: 'receptionist',
                facilityId: facilityId,
                facilityType: facility.facilityType || 'clinic',
                phone: staffPhone,
                isActive: true
            });

            updateData.onboardingStep = 3;
        }

        // Step 3: Complete Onboarding & optionally add Dummy Patient
        if (step === 3 && addDummyPatient) {
            updateData.onboardingCompleted = true;
            updateData.onboardingStep = 3;

            // Create Dummy Patient Directory entry
            const Patient = require("../models/Patient");
            const dummyPhone = "+91 99999 88888";
            let patientRecord = await Patient.findOne({ facilityId, phone: dummyPhone });
            
            const currentFacilityType = updateData.facilityType || facility.facilityType || 'clinic';

            if (!patientRecord) {
                try {
                    patientRecord = await Patient.create({
                        facilityId,
                        facilityType: currentFacilityType,
                        name: "Rahul Sharma",
                        phone: dummyPhone,
                        gender: "Male",
                        age: 30,
                        status: "Active",
                        totalVisits: 1,
                        lastVisit: new Date(),
                        lastVisitType: "CONSULTATION"
                    });
                } catch (err) {
                    patientRecord = await Patient.findOne({ facilityId, phone: dummyPhone });
                }
            }

            // Generate Token Number for the Dummy Patient
            const Counter = require("../models/Counter");
            const Queue = require("../models/Queue");

            let counter = await Counter.findById(`token:${facilityId}:${currentFacilityType}`);
            if (!counter) {
                const lastToken = await Queue.findOne({ facilityId, facilityType: currentFacilityType })
                    .sort({ tokenNumber: -1 });
                
                let startNum = 0;
                if (lastToken) {
                    startNum = lastToken.tokenNumber;
                }
                try {
                    await Counter.create({ _id: `token:${facilityId}:${currentFacilityType}`, seq: startNum });
                } catch (err) {
                    // Ignore
                }
            }

            const counterUpdate = await Counter.findByIdAndUpdate(
                `token:${facilityId}:${currentFacilityType}`,
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const nextToken = counterUpdate.seq;

            // Create Queue entry
            const dummyQueueEntry = await Queue.create({
                facilityId,
                facilityType: currentFacilityType,
                patientId: patientRecord ? patientRecord._id : null,
                patientName: "Rahul Sharma",
                phone: dummyPhone,
                tokenNumber: nextToken,
                status: "waiting",
                createdAt: new Date()
            });

            // Emit socket updates
            try {
                const { emitQueueUpdate, emitPublicQueueUpdate } = require("../sockets/queue.socket");
                emitQueueUpdate(facilityId, currentFacilityType, {
                    action: "add",
                    patient: dummyQueueEntry
                });
                emitPublicQueueUpdate(facilityId);
            } catch (socketErr) {
                console.error("Socket emit failed for dummy patient onboarding:", socketErr.message);
            }
        } else if (step === 3) {
            updateData.onboardingCompleted = true;
            updateData.onboardingStep = 3;
        }

        // Apply all updates to facility
        const updatedFacility = await Facility.findByIdAndUpdate(facilityId, updateData, { new: true });

        res.status(200).json({ 
            success: true, 
            message: "Onboarding step updated successfully",
            data: updatedFacility,
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error("Onboarding error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
