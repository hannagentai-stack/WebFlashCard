FROM node:20-slim AS builder

WORKDIR /app

# Install native build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN node bundle-maker.js

FROM node:20-slim

WORKDIR /app

# Runtime dependencies
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["node", "server.js"]
