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

ARG VITE_SLACK_CLIENT_ID
ENV VITE_SLACK_CLIENT_ID=$VITE_SLACK_CLIENT_ID

ARG VITE_APP_VERSION
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Step 6: Build the application
RUN npm run build

# Step 7: Use a lightweight web server for production
FROM nginx:1.25-alpine

# Step 8: Copy the build output to NGINX's default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Copy the custom error page
# COPY upgrade.html /usr/share/nginx/html/upgrade.html

# Step 10: Copy the custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 11: Expose port 80
EXPOSE 80

# Step 12: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
