# Use official Node 20 LTS Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests from backend
COPY backend/package*.json ./backend/

# Install dependencies in backend directory
WORKDIR /app/backend
RUN npm install --production

# Copy all source code (frontend and backend)
WORKDIR /app
COPY . .

# Create uploads directory inside backend
RUN mkdir -p backend/uploads

# Expose port
EXPOSE 5000

# Set working directory to backend to run node server.js
WORKDIR /app/backend
CMD ["node", "server.js"]
