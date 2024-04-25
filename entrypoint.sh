#!/bin/bash

# Run the Azure CLI command to create the storage container
az storage container create --name turing-videos --connection-string "$AZURE_CONNECTION_STRING"

# Pass control to the main entrypoint script with any arguments passed to the container
exec "$@"
