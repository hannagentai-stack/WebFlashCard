FROM node:22-bookworm-slim

WORKDIR /app

# 3. Xác nhận phiên bản Node và npm trong image
RUN node -v && npm -v

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

# 2. Cô lập module native: kiểm tra better-sqlite3 ngay sau npm ci
RUN node -e "const D=require('better-sqlite3'); const db=new D(':memory:'); console.log('sqlite OK', db.prepare('select sqlite_version() v').get())"

# Copy toàn bộ mã nguồn (được lọc bởi .dockerignore)
COPY . .

# 1. Kiểm tra xác nhận file server và cấu trúc app tồn tại trong image
RUN ls -la /app
RUN ls -la /app/server

# Chạy build frontend
RUN npm run build

# Tạo sẵn thư mục cho SQLite database và uploads
RUN mkdir -p data uploads

# Biến môi trường production & cổng mặc định của Render
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# 5. Tạm thời đổi CMD để kiểm tra container có start được không
CMD ["node", "-e", "console.log('hello from container')"]
