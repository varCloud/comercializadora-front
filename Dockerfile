# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy npm and package configuration
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci

# Copy all project files (filtered by .dockerignore)
COPY . .

# Run the build
RUN npm run build

# Production stage - Lightweight
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist

# Render asigna el puerto dinámicamente en la variable PORT
EXPOSE 3000
CMD serve -s dist -l ${PORT:-3000}
