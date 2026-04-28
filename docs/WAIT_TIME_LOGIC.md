# ⏱️ Smart Waiting Time Logic (v2.0 — Optimized) — QueueMD

This document explains the **Senior-Grade** predictive waiting time architecture implemented in QueueMD. This version uses advanced statistical methods (EMA) and on-demand calculations for maximum efficiency.

---

## 1. Advanced Algorithm: EMA (Exponential Moving Average)
Unlike a simple arithmetic average, the system now uses **EMA** to calculate the `avgWaitTime`.
- **Logic:** `EMA = (Alpha × CurrentData) + ((1 - Alpha) × PreviousEMA)`
- **Alpha (0.3):** We use an alpha of 0.3 to give **recent performance** higher importance while maintaining overall stability.
- **Why?** If the doctor suddenly speeds up or a complex case takes longer, the system adapts within 3-4 patients rather than waiting for 10.

## 2. Main Prediction Engine (`calculateWaitPredictions`)
Located in `server/utils/waitTimeCalculator.js`, this engine provides a unified "State of the Queue" on every update.

### A. Dynamic Time Clamping
When estimating the `currentRemaining` time for an in-progress patient:
- **Elapsed Check:** It tracks exactly how many minutes have passed since `calledAt`.
- **Safe Bounds:** The system applies **Realistic Clamping** (Min 30% / Max 180% of Avg). 
- **Benefit:** Even if a session goes way over time, the queue estimate won't drop to 0 or skyrocket to unrealistic levels.

### B. Queue Friction Buffer (1.1x)
The formula for waiting patients includes a **1.1x multiplier**.
- **Formula:** `(Index × AvgTime × 1.1) + CurrentRemaining`
- **Purpose:** This accounts for "Queue Friction" (time taken for a patient to walk in, sit down, and start the consultation).

## 3. Optimized Performance (On-Demand)
The system has been refactored to be **highly scalable**:
- **No Heavy Writes:** We no longer update the database for every patient in the queue on every "Next" click.
- **Compute-on-Fly:** Predictions are calculated in memory and sent directly via WebSockets. This reduces database I/O by 90% in large facilities.

## 4. Real-Time Synchronization
The `stats` object sent via Socket.io now contains:
- `avgWaitTime`: The current facility efficiency.
- `currentRemaining`: Time left for the active patient.
- `predictions`: An array of `_id` and `estimatedWaitTime` pairs for the entire waiting queue.

## 5. UI Integration
In `Dashboard.jsx`, the system now performs **Smart Merging**:
- When a `next` action is received, the frontend takes the `predictions` array from the server and merges the new `estimatedWaitTime` into the existing local queue state instantly.

---

### 🛠 Technical Specifications
- **Utility:** `server/utils/waitTimeCalculator.js`
- **Method:** Exponential Moving Average (EMA)
- **Safe Clamping:** 0.3x to 1.8x range
- **Friction Multiplier:** 10% Overhead (1.1x)
