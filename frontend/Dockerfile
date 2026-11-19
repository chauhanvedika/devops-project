# --- Stage 1: build the React app ---
FROM node:20-alpine AS build
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The SPA calls the relative path /api; nginx proxies it to the backend at runtime,
# so ONE image works in every environment (no URL baked in at build time).
RUN npm run build

# --- Stage 2: serve with nginx (non-root by design) ---
FROM nginxinc/nginx-unprivileged:1.27-alpine
USER root
RUN apk update && apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/html
# *.template files are rendered with envsubst at container start (BACKEND_URL)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:5000

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]