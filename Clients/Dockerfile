# Step 1: Use a Node.js base image
FROM node:20-alpine AS build

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application files
COPY . .
# COPY startup.sh /app/startup.sh

# Step 6: Build the application
RUN npm run build-dev

# Step 7: Use a lightweight web server for production
FROM nginx:1.25-alpine

# Step 8: Copy the build output to NGINX's default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Expose port 80
EXPOSE 80

# Step 10: Copy the startup script into the container (before chmod)
# COPY --from=build /app/startup.sh /usr/local/bin/startup.sh

# Step 11: Make the script executable
# RUN chmod +x /usr/local/bin/startup.sh

# Step 12: Set the entry point to the startup script
# ENTRYPOINT ["/usr/local/bin/startup.sh"]

# Step 13: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
