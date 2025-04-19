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

# Step 6: Build the application
RUN npm run build

# Step 7: Use a lightweight web server for production
FROM nginx:1.25-alpine

# Step 8: Copy the build output to NGINX's default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Copy the custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 10: Expose port 80
EXPOSE 80

# Step 11: Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
