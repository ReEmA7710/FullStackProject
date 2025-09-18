# ===== Build Stage =====
FROM node:18-alpine AS build
WORKDIR /app
# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci
# Copy the rest of the application and build for production
COPY . .
RUN npm run build -- --configuration production
# ===== Run Stage =====
FROM nginx:alpine
# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*
# Copy built frontend files from build stage
COPY --from=build /app/dist/frontend/ /usr/share/nginx/html/
# Expose container port
EXPOSE 80
# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
# NOTE: If you want to use a custom nginx.conf, uncomment the line below
# COPY nginx.conf /etc/nginx/nginx.conf
