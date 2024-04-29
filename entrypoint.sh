#!/bin/bash

# Source NVM (Node Version Manager)
source $NVM_DIR/nvm.sh

# Run emulator
azurite-blob -l ./azure-blob-storage &
echo "SYN1"
echo "${BLOB_STORAGE_URL}"
echo "SYN2"
echo "$BLOB_STORAGE_URL"
# Run the Azure CLI command to create the storage container
az storage container create --name turing-videos --connection-string "${BLOB_STORAGE_URL}"

# Pass control to the main entrypoint script with any arguments passed to the container
exec "$@"
