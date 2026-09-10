# --- Stage 1: build the React app ---
FROM node:20-alpine AS build
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL is baked in at build time - pass via --build-arg in CI/CD
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: serve with nginx (non-root by design) ---
# --- Stage 2: serve with nginx (non-root by design) ---
FROM nginxinc/nginx-unprivileged:1.27-alpine
USER root
RUN apk update && apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/htmll
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
