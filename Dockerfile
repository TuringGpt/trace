FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Install NVM (Node Version Manager)
ENV NVM_DIR="/usr/local/nvm"
RUN apt-get update && apt-get install -y curl bash git \
    && mkdir -p "$NVM_DIR" \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install 18.15.0 \
    && nvm use v18.15.0 \
    && nvm alias default v18.15.0

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install azurite globally
RUN . "$NVM_DIR/nvm.sh" && npm install -g azurite

# Define the build argument for BLOB_STORAGE_URL
ARG BLOB_STORAGE_URL

# Create a .env file with the provided variables
RUN echo "BLOB_STORAGE_URL='$BLOB_STORAGE_URL'" > .env

# Copy the entire project to the working directory
COPY . .

# Clean install Node.js dependencies
RUN . "$NVM_DIR/nvm.sh" && npm ci

# Copy the entrypoint script from the app directory into the container
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Set the default command to start the application using the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
