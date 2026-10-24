# Use official Puppeteer Docker image which includes Chromium + all required Linux libraries
FROM ghcr.io/puppeteer/puppeteer:24.4.0

# Switch to root to configure app directory
USER root
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies only (skip re-downloading chrome as it's already built-in)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production
ENV PORT=3000

RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "server.js"]
