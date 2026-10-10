FROM node:22-bookworm-slim

WORKDIR /app

# Cài đặt build tools (python3, make, g++) để biên dịch native addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors trước để tận dụng cache
COPY package*.json ./

# Cài đặt dependencies sạch từ lockfile
RUN npm ci

# Copy toàn bộ mã nguồn (được lọc bởi .dockerignore)
COPY . .

# Chạy build frontend
RUN npm run build

# Tạo sẵn thư mục cho SQLite database và uploads
RUN mkdir -p data uploads

# Biến môi trường production & cổng mặc định của Render
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Khởi động server production
CMD ["node", "server.js"]
