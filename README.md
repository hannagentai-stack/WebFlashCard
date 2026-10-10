# 🗂️ WebFlashCard - Ứng Dụng Học Từ Vựng Song Ngữ Thông Minh

WebFlashCard là ứng dụng web học từ vựng bằng flashcard hiện đại hỗ trợ hai ngôn ngữ **Tiếng Anh** và **Tiếng Trung (HSK)**. Ứng dụng tích hợp hệ thống xác thực tài khoản bảo mật, cơ sở dữ liệu SQLite cục bộ, tính năng tải lên tài liệu đa định dạng với màn hình xem trước và chỉnh sửa thẻ, tự động sinh Pinyin tiếng Trung có dấu thanh, thuật toán lặp lại ngắt quãng **SuperMemo-2 (SM-2 SRS)**, giao diện thay đổi theo ngôn ngữ (Dual Themes), và Chế độ học tập trung (Focus Mode) tối ưu hóa trải nghiệm trên điện thoại.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Động

Ứng dụng chạy hoàn toàn độc lập trên môi trường Node.js mà không cần cài đặt thêm daemon dịch vụ hay cơ sở dữ liệu ngoại vi nào (Zero external daemon).

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **npm**: Đi kèm với Node.js

### Cài đặt và khởi chạy một lệnh duy nhất
```bash
# 1. Cài đặt các thư viện phụ thuộc (chỉ cần chạy lần đầu)
npm install

# 2. Khởi chạy toàn bộ hệ thống (Backend Express + Web Server)
npm run dev
```

Sau khi khởi chạy thành công, truy cập ứng dụng tại:
👉 **`http://localhost:3000`**

### Chạy bộ kiểm thử tự động (E2E Test Suite)
```bash
# Chạy toàn bộ 541 kịch bản kiểm thử E2E (Tiers 1 - 4)
node tests/e2e/run-all-e2e.js
```

---

## 🗄️ Kiến Trúc Cơ Sở Dữ Liệu SQLite

Ứng dụng sử dụng cơ sở dữ liệu nhúng **SQLite** thông qua thư viện hiệu năng cao `better-sqlite3`. Tệp tin cơ sở dữ liệu được lưu cục bộ an toàn tại `data/webflashcard.db`.

Hệ thống bao gồm 6 bảng thực thể quan hệ chính:

1. **`users`**: Quản lý tài khoản người dùng
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `email` (TEXT, UNIQUE): Địa chỉ email đăng ký
   - `password_hash` (TEXT): Mật khẩu băm an toàn bằng bcrypt
   - `name` (TEXT): Tên hiển thị người dùng
   - `created_at`, `updated_at` (DATETIME)

2. **`decks`**: Quản lý các bộ thẻ học tập của từng người dùng
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE)
   - `name` (TEXT): Tên bộ thẻ
   - `lang` (TEXT): Ngôn ngữ học (`en` cho Tiếng Anh, `zh` cho Tiếng Trung)
   - `description` (TEXT): Mô tả bộ thẻ
   - `created_at`, `updated_at` (DATETIME)

3. **`cards`**: Danh sách thẻ từ vựng thuộc từng bộ thẻ
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `deck_id` (INTEGER, FK -> decks.id, ON DELETE CASCADE)
   - `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE)
   - `term` (TEXT): Từ vựng tiếng Anh hoặc chữ Hán
   - `phonetic` (TEXT): Phiên âm IPA (tiếng Anh) hoặc Pinyin có dấu thanh (tiếng Trung)
   - `pos` (TEXT): Loại từ (danh từ, động từ, tính từ...)
   - `meaning` (TEXT): Nghĩa tiếng Việt
   - `example` (TEXT): Câu ví dụ ngoại ngữ
   - `example_trans` (TEXT): Dịch nghĩa câu ví dụ sang tiếng Việt
   - `hsk_level` (TEXT): Cấp độ HSK (HSK 1 - HSK 6) nếu là tiếng Trung
   - `created_at`, `updated_at` (DATETIME)

4. **`progress`**: Lưu trữ trạng thái và lịch ôn tập SRS theo từng thẻ
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `card_id` (INTEGER, UNIQUE, FK -> cards.id, ON DELETE CASCADE)
   - `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE)
   - `status` (TEXT): Trạng thái thẻ (`new`, `learning`, `review`, `mastered`)
   - `reps` (INTEGER): Số lần ôn tập thành công liên tiếp
   - `interval` (INTEGER): Khoảng cách ngày đến lần ôn tiếp theo
   - `ease_factor` (REAL): Hệ số dễ (mặc định 2.5 theo SM-2)
   - `next_review_date` (TEXT): Ngày đến hạn ôn tiếp theo (`YYYY-MM-DD`)
   - `last_reviewed_at` (DATETIME)

5. **`study_logs`**: Lịch sử ôn tập chi tiết để phân tích thống kê và vẽ biểu đồ 7 ngày
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE)
   - `card_id` (INTEGER, FK -> cards.id, ON DELETE SET NULL)
   - `deck_id` (INTEGER, FK -> decks.id, ON DELETE SET NULL)
   - `rating` (INTEGER): Điểm đánh giá (1: Quên, 2: Khó, 3: Được, 4: Dễ)
   - `study_mode` (TEXT): Chế độ học (`new`, `review`, `quiz`, `typing`)
   - `created_at` (DATETIME)

6. **`uploads`**: Nhật ký các tệp tài liệu đã tải lên của từng người dùng
   - `id` (INTEGER, PK, AUTOINCREMENT)
   - `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE)
   - `filename` (TEXT), `original_name` (TEXT), `file_path` (TEXT), `mime_type` (TEXT), `file_size` (INTEGER)
   - `lang` (TEXT), `status` (TEXT), `card_count` (INTEGER)
   - `created_at` (DATETIME)

---

## 📡 Danh Sách API Endpoints Tham Khảo (`/api/*`)

Hệ thống cung cấp đầy đủ các REST API endpoints được phân quyền bảo mật chặt chẽ:

### 1. Xác thực & Tài khoản (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản mới (email, mật khẩu tối thiểu 8 ký tự, tên hiển thị)
- `POST /api/auth/login`: Đăng nhập, cấp JWT trong cookie `httpOnly` (hỗ trợ ghi nhớ đăng nhập)
- `POST /api/auth/logout`: Đăng xuất và xóa phiên đăng nhập
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại
- `POST /api/auth/forgot-password`: Hướng dẫn khôi phục mật khẩu

### 2. Quản lý Bộ Thẻ (`/api/decks`)
- `GET /api/decks`: Danh sách bộ thẻ của người dùng (hỗ trợ lọc `?lang=en|zh`)
- `POST /api/decks`: Tạo bộ thẻ mới (`name`, `lang`, `description`)
- `GET /api/decks/:id`: Xem chi tiết bộ thẻ kèm danh sách thẻ
- `PUT /api/decks/:id`: Cập nhật tên và mô tả bộ thẻ
- `DELETE /api/decks/:id`: Xóa bộ thẻ và xóa phân cấp toàn bộ thẻ, tiến độ liên quan

### 3. Quản lý Thẻ Từ Vựng (`/api/cards`)
- `POST /api/cards`: Thêm thẻ từ vựng mới vào bộ thẻ
- `GET /api/cards/:id`: Xem chi tiết thông tin thẻ
- `PUT /api/cards/:id`: Chỉnh sửa từ vựng, phiên âm, nghĩa, ví dụ
- `DELETE /api/cards/:id`: Xóa thẻ và tiến độ ôn tập liên quan

### 4. Tải Lên Tài Liệu & Trích Xuất Thẻ (`/api/uploads`)
- `POST /api/uploads`: Tải lên tệp tài liệu (tối đa 10 MB, lưu riêng tại `uploads/{userId}/`), trả về danh sách thẻ xem trước
- `POST /api/uploads/:id/commit`: Xác nhận lưu danh sách thẻ đã xem trước và chỉnh sửa vào bộ thẻ CSDL
- `GET /api/uploads`: Xem lịch sử các tệp tài liệu đã tải lên
- `DELETE /api/uploads/:id`: Xóa tệp tài liệu đã tải lên

### 5. Phiên Học & Thuật Toán SRS (`/api/study`)
- `GET /api/study/new`: Lấy danh sách thẻ mới chưa học (`?deckId=...&limit=...`)
- `GET /api/study/due`: Lấy danh sách thẻ đến hạn ôn tập hôm nay (`?deckId=...&limit=...`)
- `GET /api/study/quiz`: Sinh phiên trắc nghiệm 4 lựa chọn ngẫu nhiên (`?deckId=...&limit=...`)
- `POST /api/study/review`: Ghi nhận đánh giá sau khi lật thẻ và cập nhật lịch ôn SM-2

### 6. Thống Kê & Phân Tích (`/api/stats`)
- `GET /api/stats`: Lấy tổng số thẻ, số thẻ đã học, số thẻ cần ôn hôm nay, tỉ lệ chính xác và chuỗi ngày học liên tục (Streak)
- `GET /api/stats/activity-7d`: Lấy dữ liệu hoạt động ôn tập trong 7 ngày gần nhất để vẽ biểu đồ cột

---

## 📥 Hỗ Trợ Tải Lên Tài Liệu & Tự Sinh Pinyin

Người dùng có thể tự tải lên tài liệu học tập cá nhân với 6 định dạng phổ biến:
- **`.txt`**: Định dạng văn bản thuần
- **`.md`**: Tệp Markdown
- **`.csv`**: Tệp bảng dữ liệu CSV (hỗ trợ phân tách dấu phẩy hoặc tab)
- **`.xlsx`**: Tệp bảng tính Microsoft Excel
- **`.docx`**: Tệp tài liệu Microsoft Word (sử dụng thư viện `mammoth`)
- **`.pdf`**: Tệp tài liệu PDF (trích xuất nội dung văn bản)

### Quy tắc nhận diện thẻ:
- Nhận diện các dòng có cấu trúc `từ - nghĩa` hoặc `từ<tab>nghĩa`
- Bảng tính CSV / XLSX tự động trích xuất các cột tương ứng: Từ vựng, Phiên âm, Từ loại, Nghĩa, Ví dụ
- Văn bản dài: tự động tách các từ mới chưa có trong bộ thẻ
- **Tự động sinh Pinyin tiếng Trung**: Sử dụng thư viện `pinyin-pro` để tự động sinh Pinyin chuẩn có dấu thanh cho chữ Hán nếu tài liệu tải lên chưa có
- **Màn hình xem trước (Preview Modal)**: Cho phép người dùng kiểm tra danh sách thẻ được nhận diện, tích chọn hoặc bỏ chọn từng thẻ, chỉnh sửa trực tiếp từ vựng, pinyin và nghĩa tiếng Việt trước khi lưu chính thức vào cơ sở dữ liệu

---

## 🧠 4 Chế Độ Học & Thuật Toán SuperMemo-2 (SM-2)

1. ✨ **Học mới (New)**: Học các thẻ từ vựng mới chưa từng tiếp xúc
2. 🔄 **Ôn tập (Due Review)**: Học các thẻ đã đến hạn ôn tập hôm nay được tính toán theo thuật toán SM-2
3. 🧩 **Trắc nghiệm (Quiz)**: Luyện tập với 4 đáp án nghĩa tiếng Việt ngẫu nhiên, phản hồi đúng/sai tức thì kèm âm thanh và ký hiệu trực quan (✅/❌)
4. ⌨️ **Điền từ (Typing)**: Kiểm tra khả năng nhớ từ bằng cách gõ từ tiếng Anh hoặc Pinyin tiếng Trung tương ứng với nghĩa tiếng Việt hiển thị, có gợi ý và chuẩn hóa dấu thanh

### Thuật toán lặp lại ngắt quãng SM-2:
Sau khi lật thẻ, người dùng đánh giá mức độ ghi nhớ qua 4 nút bấm:
- **1 - Quên (Again)**: Reset chu kỳ về 1 ngày, giảm nhẹ hệ số `easeFactor`
- **2 - Khó (Hard)**: Khoảng cách ngắn, giảm hệ số `easeFactor`
- **3 - Được (Good)**: Tăng khoảng cách ôn tập chuẩn theo công thức SM-2
- **4 - Dễ (Easy)**: Mở rộng khoảng cách ôn tập nhanh chóng, tăng hệ số `easeFactor`

---

## 🎨 Giao Diện Theo Ngôn Ngữ & Thiết Kế Mobile-First

### Hai Theme màu tự động theo ngôn ngữ:
- 🇨🇳 **Tiếng Trung**: Tông hồng pastel sáng dịu mắt. Nền trắng ngà hơi hồng (`#FFF7FA`), màu nhấn hồng đào (`#F472B6`), chữ xám đậm ấm (`#3B2A33`), bóng đổ mềm, thẻ bo góc lớn (`20px`), phông chữ hỗ trợ CJK sắc nét (`"Noto Sans SC"`, `"PingFang SC"`, `"Microsoft YaHei"`, sans-serif).
- 🇬🇧 **Tiếng Anh**: Tông xanh da trời sáng hiện đại. Nền xanh rất nhạt (`#F5FBFF`), màu nhấn xanh da trời (`#38BDF8`), chữ xanh xám đậm (`#1E3A4A`), bo góc thanh thoát (`16px`), phông chữ `Inter` hoặc sans-serif sạch sẽ.

### Trải nghiệm Mobile-First & Chế độ học tập trung (Focus Mode):
- Kích thước vùng chạm tối thiểu **44x44 px** cho mọi nút bấm, tối ưu hóa cho màn hình cảm ứng điện thoại
- Hỗ trợ safe area insets `env(safe-area-inset-bottom)` cho tai thỏ và thanh home điện thoại
- Thanh điều hướng dưới cùng (**Bottom Navigation**) trên điện thoại, tự động mở rộng thành **Sidebar** bên trái trên máy tính
- **Chế độ học tập trung (Focus Mode)**: Khi bắt đầu học, ẩn hoàn toàn thanh điều hướng và mọi yếu tố xao nhãng; chỉ hiển thị 1 thẻ trung tâm, thanh tiến độ mỏng phía trên và nút thoát (✖)
- Hỗ trợ cử chỉ vuốt chạm (**Swipe Gestures**): Chạm hoặc vuốt lên để lật thẻ; vuốt trái/phải để chấm điểm đánh giá
- Tích hợp phát âm chuẩn bản xứ bằng **Web Speech API** (`en-US` và `zh-CN`)
