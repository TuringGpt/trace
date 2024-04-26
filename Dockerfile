FROM python:3.11.6-alpine3.18

# Install NVM (Node Version Manager)
ENV NVM_DIR="/usr/local/nvm"
RUN apk add --no-cache curl bash \
    && mkdir -p "$NVM_DIR" \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash \
    && source "$NVM_DIR/nvm.sh" \
    && nvm install 18.15.0 \
    && nvm use v18.15.0 \
    && nvm alias default v18.15.0

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project to the working directory
COPY . .

# Switch to root user temporarily to perform operations that require elevated privileges
USER root

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
