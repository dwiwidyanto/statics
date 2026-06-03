# --- Stage 1: Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and lockfile
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the Svelte/Vite production package
RUN npm run build

# --- Stage 2: Runtime Stage ---
FROM nginx:alpine

# Copy custom Nginx configuration for single-page-app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy production build from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for Coolify
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
