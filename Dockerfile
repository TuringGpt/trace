# Use a Node.js base image
FROM node:18.15

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project to the working directory
COPY . .

# Switch to root user temporarily to perform operations that require elevated privileges
USER root

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential libssl-dev zlib1g-dev libbz2-dev \
                        libreadline-dev libsqlite3-dev wget curl llvm \
                        libncurses5-dev libncursesw5-dev xz-utils tk-dev \
                        libffi-dev liblzma-dev python3-openssl git

# Download and extract Python 3.8 source code
RUN mkdir ~/python38 && \
    cd ~/python38 && \
    wget https://www.python.org/ftp/python/3.8.16/Python-3.8.16.tgz && \
    tar -xf Python-3.8.16.tgz

# Configure the build
RUN cd ~/python38/Python-3.8.16 && \
    ./configure --enable-optimizations

# Compile the source code
RUN cd ~/python38/Python-3.8.16 && \
    make -j$(nproc)

# Install Python
RUN cd ~/python38/Python-3.8.16 && \
    make install

# Verify the installation
RUN python3.8 --version

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
