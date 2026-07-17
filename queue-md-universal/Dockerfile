# ── STAGE 1: PREPARE SERVER & DEPENDENCIES ───────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy package descriptors and install only production dependencies
COPY server/package*.json ./
RUN npm ci --only=production --silent

# Copy server code
COPY server/ ./

# ── STAGE 2: FINAL SECURE RUNTIME CONTAINER ─────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# 🔒 SECURITY: Configure production environment flags
ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper process supervision (avoids PID 1 signal leakage)
RUN apk add --no-cache dumb-init

# Copy pre-configured production dependencies and server runtime
COPY --from=server-builder /app/server ./server

# 🔒 SECURITY: Grant ownership of /app to standard non-root user "node"
RUN chown -R node:node /app

# 🔒 SECURITY: Switch container execution to non-root privileges
USER node

# Expose port for inbound API traffic
EXPOSE 5000

# Run server with process supervisor
WORKDIR /app/server
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
