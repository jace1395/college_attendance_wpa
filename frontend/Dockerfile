# Stage 1: Build the React + Vite application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite application (outputs to dist/ by default)
RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:alpine

# Copy the built assets from Stage 1 into the Nginx static serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx daemon
CMD ["nginx", "-g", "daemon off;"]
