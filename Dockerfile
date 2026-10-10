FROM node:20-bookworm-slim

WORKDIR /app

# Install native build tools for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install and rebuild better-sqlite3 directly from source on Debian
RUN npm install && npm rebuild better-sqlite3 --build-from-source

COPY . .

RUN node bundle-maker.js

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]
