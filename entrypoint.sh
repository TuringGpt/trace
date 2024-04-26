#!/bin/bash

# Run emulator
azurite-blob -l ./azure-blob-storage &

# Run the Azure CLI command to create the storage container
az storage container create --name turing-videos --connection-string "$BLOB_STORAGE_URL"

# Pass control to the main entrypoint script with any arguments passed to the container
exec "$@"
