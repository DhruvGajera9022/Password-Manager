# Stage 1 - Build
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2 - Run
FROM node:18-alpine

WORKDIR /app

# Copy only the built app and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set default command
CMD ["node", "dist/src/main"]

# Expose app port
EXPOSE 8000
