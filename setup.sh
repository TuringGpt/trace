#!/bin/bash
set -e

# Install application dependencies
npm ci

# Create a .env file with the provided variables
echo "MODE='${MODE}'" > .env
echo "BLOB_STORAGE_URL='${BLOB_STORAGE_URL}'" >> .env

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install and start Azurite for local development
npm install -g azurite
