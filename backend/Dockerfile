# Use official Node 20 LTS Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

# Expose port (Render sets PORT environment variable dynamically)
EXPOSE 5000

# Start application
CMD ["npm", "start"]
