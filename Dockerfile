# Use a Node.js base image
FROM node:18.15

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project to the working directory
COPY . .

# Switch to root user temporarily to perform operations that require elevated privileges
USER root

# Install Python 3.11
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.11 && \
    ln -s /usr/bin/python3.11 /usr/bin/python

# Install application dependencies
RUN npm ci

# Create a .env file with the provided variables
RUN echo "MODE='${MODE}'" > .env && \
    echo "BLOB_STORAGE_URL='${BLOB_STORAGE_URL}'" >> .env

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install and start Azurite for local development
RUN npm install -g azurite
RUN azurite-blob -l ./azure-blob-storage &

# Copy the entrypoint script from the app directory into the container
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Switch back to a non-root user for better security
USER node

# Set the default command to start the application using the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
