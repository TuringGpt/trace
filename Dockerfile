FROM python:3.11

# Set the working directory inside the container
# RUN mkdir -p /app
# RUN cd /app

WORKDIR /app2

RUN ls -la
RUN echo "Current directory: $(pwd)"
# Copy the entire project to the working directory
COPY . .
RUN ls -la
RUN echo "Current directory: $(pwd)"
# Switch to root user temporarily to perform operations that require elevated privileges
USER root

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
