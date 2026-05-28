# ── STAGE 1: BUILD FRONTEND ──────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy package descriptors and install dependencies
COPY client/package*.json ./
RUN npm ci --silent

# Copy client codebase and build static assets
COPY client/ ./
# Inject production environments during build stage
ENV VITE_API_URL=/api
RUN npm run build

# ── STAGE 2: PREPARE SERVER & DEPENDENCIES ───────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy package descriptors and install only production dependencies
COPY server/package*.json ./
RUN npm ci --only=production --silent

# Copy server code
COPY server/ ./

# ── STAGE 3: FINAL SECURE RUNTIME CONTAINER ─────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# 🔒 SECURITY: Configure production environment flags
ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper process supervision (avoids PID 1 signal leakage)
RUN apk add --no-cache dumb-init

# Copy built frontend assets into server's public folder
COPY --from=client-builder /app/client/dist ./server/public

# Copy pre-configured production dependencies and server runtime
COPY --from=server-builder /app/server ./server

# 🔒 SECURITY: Grant ownership of /app to standard non-root user "node"
RUN chown -R node:node /app

# 🔒 SECURITY: Switch container execution to non-root privileges
USER node

# Expose port for inbound API and asset traffic
EXPOSE 5000

# Run server with process supervisor
WORKDIR /app/server
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
