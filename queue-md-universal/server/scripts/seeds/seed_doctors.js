const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'server/.env' });

const dummyDoctors = [
  // Dental clinic doctors
  {
    name: "Dr. Amit Sharma",
    email: "amit.sharma@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    specialization: "Orthodontics",
    phone: "9876543211",
    shift: "09:00 AM - 05:00 PM",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "dental"
  },
  {
    name: "Dr. Neha Patel",
    email: "neha.patel@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
    specialization: "Periodontics",
    phone: "9876543212",
    shift: "10:00 AM - 06:00 PM",
    workingDays: ["Mon", "Tue", "Thu", "Fri", "Sat"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "dental"
  },
  // Pathlab specialists (doctor role for assignment)
  {
    name: "Dr. Shalini Iyer",
    email: "shalini.iyer@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    specialization: "Pathologist",
    phone: "9876543213",
    shift: "09:00 AM - 05:00 PM",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "pathlab"
  },
  {
    name: "Dr. Rajesh Varma",
    email: "rajesh.varma@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    specialization: "Microbiologist",
    phone: "9876543214",
    shift: "10:00 AM - 06:00 PM",
    workingDays: ["Mon", "Wed", "Thu", "Fri", "Sun"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "pathlab"
  },
  // Physio specialists (doctor role for assignment)
  {
    name: "Dr. Kabir Mehta",
    email: "kabir.mehta@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    specialization: "Sports Physiotherapist",
    phone: "9876543215",
    shift: "08:00 AM - 04:00 PM",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "physio"
  },
  {
    name: "Dr. Pooja Rao",
    email: "pooja.rao@queuemd.com",
    role: "doctor",
    isActive: true,
    profileImage: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200",
    specialization: "Pediatric Physiotherapist",
    phone: "9876543216",
    shift: "12:00 PM - 08:00 PM",
    workingDays: ["Tue", "Wed", "Fri", "Sat", "Sun"],
    facilityId: "69e4b0d5d831ce758a51eda8",
    facilityType: "physio"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const hashedPassword = await bcrypt.hash("SecurePass123!", 12);

    for (const doc of dummyDoctors) {
      const existing = await User.findOne({ email: doc.email });
      if (existing) {
        console.log(`Doctor ${doc.name} (${doc.email}) already exists. Skipping.`);
        continue;
      }
      
      await User.create({
        ...doc,
        password: hashedPassword
      });
      console.log(`Successfully seeded doctor: ${doc.name} (${doc.facilityType})`);
    }

    console.log("Doctors seeding completed successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
