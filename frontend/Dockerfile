# Stage 1: build the static files with Node
FROM node:24-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is reused while package*.json do not change
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite writes this value into the JS at build time; changing it later requires a rebuild.
# It must be reachable from the user's browser, not from inside Docker.
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: only nginx and the built files go to the final image
FROM nginx:1.28.0-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
