FROM python:3.11

# Install NVM (Node Version Manager)
ENV NVM_DIR="/usr/local/nvm"
RUN apt-get update && apt-get install -y curl bash git \
    && mkdir -p "$NVM_DIR" \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install 18.15.0 \
    && nvm use v18.15.0 \
    && nvm alias default v18.15.0 \


# Set the working directory inside the container
WORKDIR /app

# Copy the entire project to the working directory
COPY . .

# Switch to root user temporarily to perform operations that require elevated privileges
# USER root

# Run the setup script
RUN chmod +x setup.sh
RUN ./setup.sh

# Copy the entrypoint script from the app directory into the container
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Switch back to a non-root user for better security
# USER node

# Set the default command to start the application using the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
