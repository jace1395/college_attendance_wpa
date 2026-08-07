# Pull the latest Node.js LTS engine base
FROM node:24-alpine

# Set internal project directory
WORKDIR /app

# Cache dependencies by separating structural copying
COPY package*.json ./

# Install standard lockfile dependencies 
RUN npm install

# Bind all source documents
COPY . .

# Expose default React execution port
EXPOSE 3000

# Execute startup routine automatically
CMD ["npm", "start"]
