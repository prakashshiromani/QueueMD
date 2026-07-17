# Deployment Topology & Guidelines — QueueMD

This document defines the canonical deployment architecture for **QueueMD** and details the configuration variables, pipeline steps, and maintenance routines.

## 🚢 Deployment Topology (Option A: Managed Cloud Infrastructure)

QueueMD uses a fully managed, decoupled cloud architecture to ensure zero database administration overhead, high scalability, and seamless real-time WebSocket connection handling.

```
       +--------------------------------------------+
       |             Client Browser                 |
       +--------------------+-----------------------+
                            |
             HTTPS Requests | WebSockets
                            v
+---------------------------+-----------------------+
|  Frontend: Vercel CDN     |  Backend: Render      |
|  - Static HTML/JS/CSS     |  - Node.js API Server |
|  - SPA Client Routing     |  - Python Predict API |
+-------------+-------------+-----------+-----------+
              |                         |
              | Database Queries        | Redis / BullMQ
              v                         v
+-------------+-------------+-----------+-----------+
|  MongoDB Atlas Cluster    |  Upstash Redis Cache  |
|  - Managed ReplSet        |  - In-Memory Cache    |
|  - Continuous Backups     |  - Task Queues        |
+---------------------------+-----------------------+
```

### Infrastructure Summary
1. **Frontend Hosting:** [Vercel](https://vercel.com)
   * Serves optimized static assets using route splitting (`React.lazy`).
   * Rewrites all paths to `index.html` to support SPA routing (configured in `client/vercel.json`).
2. **Backend Server Hosting:** [Render](https://render.com)
   * Runs the Node.js Express API server.
   * Auto-deploys on pushing commits to the `main` branch on GitHub.
3. **Database:** [MongoDB Atlas](https://mongodb.com/atlas)
   * Fully managed replica set.
   * Automatic daily backups and schema indexes.
4. **Caching & Queue:** [Upstash Redis](https://upstash.com)
   * Fully managed serverless Redis database.
   * Handles BullMQ workers for background patient notification dispatch.

---

## 🔒 Required Environment Variables

The server uses boot-time validation via **Zod** (configured in [env.js](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal/server/config/env.js)). If any required variable is missing or insecure, the server will crash instantly with a descriptive error.

### Server Env (Render Web Service)
| Env Variable | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | Enum | Yes | `production`, `development`, or `test` |
| `PORT` | Number | No | Port on which the API server runs (default: `5000`) |
| `MONGO_URI` | Connection String | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | String | Yes | Minimum 16-character secret key for JWT validation. Cannot be default fallback! |
| `REDIS_URL` | Connection String | Yes | Upstash Redis connection string (`rediss://...`) |
| `ENCRYPTION_KEY` | String | Yes | 32-character key for database encryption. Cannot be default fallback in production! |
| `CLIENT_URL` | URL | No | URL of the frontend for CORS settings |

### Client Env (Vercel CDN)
| Env Variable | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | URL | Yes | Backend API root URL (e.g. `https://api.queuemd.com/api`) |
| `VITE_SOCKET_URL` | URL | Yes | Socket server root URL (e.g. `https://api.queuemd.com`) |

---

## 🗄️ Backup & Restore Strategy (RPO / RTO)

Healthcare applications require non-negotiable disaster recovery plans.

* **Recovery Point Objective (RPO):** **1 Hour** (maximum acceptable data loss window)
* **Recovery Time Objective (RTO):** **4 Hours** (maximum acceptable downtime)

### 1. Database (MongoDB Atlas)
* **Strategy:** Enable **Cloud Backups** in the Atlas Cluster Console.
* **Interval:** Hourly snapshots with a 7-day retention policy.
* **Restore Drill:** Validate the restore process once every quarter by restoring a production snapshot to a staging database (`queuemd-staging`) and running validation scripts to ensure schema and data integrity.

### 2. Manual Backup Fallback (AWS S3)
A daily automated cron job runs on a secure server/lambda executing `mongodump`:
```bash
mongodump --uri="$MONGO_URI" --archive | aws s3 cp - s3://queuemd-backups/db-$(date +%F).archive
```

---

## 🚀 Build and Deployment Workflow

### 1. Manual Deploy Trigger
Whenever code is merged into the `main` branch, the CI/CD pipelines trigger:
* **Vercel Frontend build:** Automatic redeployment based on repository triggers.
* **Render Backend build:** Automatic redeployment using `npm install` followed by `npm start`.

### 2. Rollback Steps
If a deployment fails or introduces a critical bug:
1. Open the **Render Dashboard** -> Go to the Web Service -> Click **Deploys** -> Select the last stable deploy and click **Rollback**.
2. Open the **Vercel Dashboard** -> Go to the Project -> Click **Deployments** -> Find the last stable deploy -> Click the three dots -> Click **Promote to Production**.
