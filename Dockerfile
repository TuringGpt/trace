# Use a Node.js base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project to the working directory
COPY . .

# Copy the entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Install application dependencies
RUN npm ci

# Create a .env file with the provided variables
RUN echo "MODE='development'" >> .env && \
    echo "BLOB_STORAGE_URL='DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;'" >> .env

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install and start Azurite for local development
RUN npm install -g azurite
RUN azurite-blob -l ./azure-blob-storage &

# Expose the port the app runs on
EXPOSE 3000

# If "start", "test", or "build" argument is passed when running the Docker image,
# override the default command accordingly
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Set the default command to start the application
CMD ["npm", "start"]
