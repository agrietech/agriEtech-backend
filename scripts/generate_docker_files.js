const fs = require('fs');

const frontendDir = 'C:/Users/a/Desktop/agrietech-frontend';

// 1. Dockerfile
const dockerfile = `# Stage 1: Build Flutter Web Application
FROM ghcr.io/cirruslabs/flutter:stable AS builder

WORKDIR /app

# Enable Flutter Web
RUN flutter config --enable-web

# Copy dependency definitions
COPY pubspec.yaml pubspec.lock ./

# Fetch Flutter dependencies
RUN flutter pub get

# Copy full application source code
COPY . .

# Build production web bundle
RUN flutter build web --release --pwa-strategy=none

# Stage 2: Production NGINX Alpine Runtime (< 25MB)
FROM nginx:alpine AS runner

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Flutter web bundle
COPY --from=builder /app/build/web /usr/share/nginx/html

# Copy custom NGINX configuration for Flutter SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
`;

fs.writeFileSync(frontendDir + '/Dockerfile', dockerfile, 'utf8');

// 2. nginx.conf
const nginxConf = `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip Compression for Web Performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml application/wasm;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static Assets & WASM Caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|otf|ttf|svg|wasm)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }

    # Flutter SPA History Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

fs.writeFileSync(frontendDir + '/nginx.conf', nginxConf, 'utf8');

// 3. .dockerignore
const dockerignore = `.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
ios/
android/
windows/
linux/
macos/
.git
.gitignore
.env.local
coverage/
test/
`;

fs.writeFileSync(frontendDir + '/.dockerignore', dockerignore, 'utf8');

// 4. docker-compose.yml
const dockerCompose = `version: '3.8'

services:
  agrietech-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agrietech-frontend-web
    restart: unless-stopped
    ports:
      - '8080:80'
    environment:
      - API_BASE_URL=https://agrietech.onrender.com/api/v1
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost/']
      interval: 30s
      timeout: 5s
      retries: 3
`;

fs.writeFileSync(frontendDir + '/docker-compose.yml', dockerCompose, 'utf8');

console.log('✅ Generated Frontend Docker suite (Dockerfile, nginx.conf, .dockerignore, docker-compose.yml)');
