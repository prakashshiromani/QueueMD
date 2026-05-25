# python_service/main.py
from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Try loading from local .env first
load_dotenv()

# Also try loading from ../server/.env as a convenient fallback
server_env = os.path.join(os.path.dirname(__file__), "../server/.env")
if os.path.exists(server_env):
    load_dotenv(dotenv_path=server_env)

app = FastAPI(title="QueueMD Wait-Time Predictor")

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    # Try another fallback if needed
    mongo_uri = "mongodb://localhost:27017/queuemd"

client = MongoClient(mongo_uri)
try:
    db = client.get_default_database()
except Exception:
    db = client.get_database("test")

@app.get("/predict-wait/{facility_id}")
def predict_wait(facility_id: str, facility_type: str = None):
    """
    Predict wait time for a given facility and optional facility type.
    If facility_type is provided, only visits of that type are used for prediction.
    This ensures Dental (25 min avg) never pollutes Pathlab (8 min avg) predictions.
    """
    try:
        if not ObjectId.is_valid(facility_id):
            raise HTTPException(status_code=400, detail="Invalid facility ID format")

        queue_col = db["queues"]

        # Build per-type filter if facilityType provided
        query_filter = {
            "facilityId": ObjectId(facility_id),
            "status": "completed"
        }
        if facility_type:
            query_filter["facilityType"] = facility_type  # e.g. "dental", "pathlab", "clinic"

        recent_visits = list(queue_col.find(query_filter).sort("completedAt", -1).limit(30))

        # If not enough data for this specific type, use realistic type-based defaults
        if len(recent_visits) < 3:
            type_defaults = {
                "clinic": 10, "hospital": 18, "pathlab": 8,
                "dental": 25, "physio": 15, "vet": 10
            }
            default_wait = type_defaults.get(facility_type, 10) if facility_type else 10
            return {"predicted_minutes": default_wait, "confidence": "low", "facilityType": facility_type}

        # Calculate average duration using stored or computed values
        durations = []
        for visit in recent_visits:
            if "actualDuration" in visit and visit["actualDuration"] is not None:
                durations.append(float(visit["actualDuration"]))
            else:
                start = visit.get("calledAt") or visit.get("createdAt")
                end = visit.get("completedAt") or (start + timedelta(minutes=15))
                if start and end:
                    diff_min = (end - start).total_seconds() / 60
                    durations.append(max(0.0, diff_min))
                else:
                    durations.append(15.0)

        if not durations:
            return {"predicted_minutes": 10, "confidence": "low", "facilityType": facility_type}

        avg_wait = sum(durations) / len(durations)

        # Per-type realistic clamp ranges (viva architecture point)
        type_clamp = {
            "clinic":   (5,  30),
            "hospital": (10, 60),
            "pathlab":  (5,  20),
            "dental":   (15, 60),
            "physio":   (10, 40),
            "vet":      (5,  30),
        }
        min_val, max_val = type_clamp.get(facility_type, (5, 45)) if facility_type else (5, 45)
        avg_wait = max(float(min_val), min(float(max_val), avg_wait))

        return {
            "predicted_minutes": round(avg_wait),
            "confidence": "high",
            "facilityType": facility_type,
            "sample_size": len(durations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
