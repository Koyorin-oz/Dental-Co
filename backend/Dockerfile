FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files (context is repo root)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm install --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY backend/ .

# Build
RUN npm run build && ls -la dist/ || (echo "BUILD FAILED - dist not created" && exit 1)

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/src/main"]
