# Step 1: Use a Node.js base image
FROM node:20-alpine AS build

# Increase Node.js memory limit for the build
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy only package.json (not package-lock.json)
# This allows npm to generate a fresh lock file for Linux Alpine with correct platform binaries
COPY package.json ./

# Step 4: Install dependencies fresh for Linux platform
# This ensures platform-specific binaries (like @rollup/rollup-linux-x64-musl) are correctly installed
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

ARG VITE_BRANDFETCH_API_KEY
ENV VITE_BRANDFETCH_API_KEY=$VITE_BRANDFETCH_API_KEY

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
