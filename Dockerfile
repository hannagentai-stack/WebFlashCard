FROM node:20-slim

WORKDIR /app

# Cài đặt build tools (python3, make, g++) để biên dịch better-sqlite3 native addon trên Debian Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors trước để tận dụng Docker cache layer
COPY package*.json ./

# Cài đặt dependencies sạch từ lockfile trong container (không copy node_modules từ local)
RUN npm ci

# Copy toàn bộ mã nguồn (đã được lọc qua .dockerignore, không có node_modules hay *.db local)
COPY . .

# Chạy build frontend
RUN npm run build

# Tạo sẵn thư mục cho SQLite database và file uploads
RUN mkdir -p data uploads

# Biến môi trường production & cổng mặc định của Render
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Khởi động server production
CMD ["node", "server.js"]
