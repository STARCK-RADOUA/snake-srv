# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files from your local backend folder to the container
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
