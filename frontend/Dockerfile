# Use the rock-solid Node.js 22 LTS base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package management files to cache dependencies
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of your React frontend source code
COPY . .

# Expose the standard React development server port
EXPOSE 3000

# Automatically start the React development environment
CMD ["npm", "start"]
