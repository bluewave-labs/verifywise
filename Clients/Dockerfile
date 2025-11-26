# Step 1: Use a Node.js base image
FROM node:20-alpine AS build

# Increase Node.js memory limit for the build
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Step 4: Install dependencies with optimizations for cross-platform builds
# Use npm install instead of npm ci to allow platform-specific dependencies to be resolved
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps

# Step 5: Copy the rest of the application files
COPY . .

# Step 6: Accept env variables for Vite
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

ARG VITE_SLACK_CLIENT_ID
ENV VITE_SLACK_CLIENT_ID=$VITE_SLACK_CLIENT_ID

ARG VITE_APP_VERSION
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Step 7: Build the application
RUN npm run build

# Step 8: Use a lightweight web server for production
FROM nginx:1.25-alpine

# Step 9: Copy the build output to NGINX's default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Copy the custom error page
# COPY upgrade.html /usr/share/nginx/html/upgrade.html

# Step 10: Copy the custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 11: Expose port 80
EXPOSE 80

# Step 12: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
