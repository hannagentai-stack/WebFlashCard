/**
 * Thuật toán lặp lại ngắt quãng SM-2 (SuperMemo-2 SRS)
 * Quản lý khoảng cách ngày ôn tập, hệ số độ dễ (Ease Factor) và trạng thái thẻ
 */

/**
 * Lấy chuỗi ngày định dạng YYYY-MM-DD
 * @param {Date} [date]
 * @returns {string}
 */
export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cộng thêm n ngày vào một ngày cụ thể
 * @param {Date|string} date
 * @param {number} days
 * @returns {string}
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Tính toán trạng thái SRS sau khi người dùng đánh giá thẻ
 * 
 * Các mức đánh giá (rating):
 * 1 = "again" (Quên): Chưa nhớ, cần học lại ngay
 * 2 = "hard" (Khó): Nhớ được nhưng vất vả, khoảng cách ngắn
 * 3 = "good" (Được): Nhớ tương đối tốt, áp dụng khoảng cách chuẩn SM-2
 * 4 = "easy" (Dễ): Nhớ rất rõ và nhanh, tăng khoảng cách và độ dễ
 * 
 * @param {Object} card Thẻ hiện tại
 * @param {number} rating Mức đánh giá (1, 2, 3, 4)
 * @param {string} [currentDateStr] Ngày đánh giá (mặc định là hôm nay)
 * @returns {Object} Thẻ mới sau khi cập nhật các chỉ số SRS
 */
export function calculateNextReview(card, rating, currentDateStr = formatDate()) {
  // Bản sao của thẻ để tránh làm biến đổi đối tượng gốc
  const updatedCard = { ...card };
  
  let reps = Number(updatedCard.reps) || 0;
  let interval = Number(updatedCard.interval) || 0;
  let easeFactor = Number(updatedCard.easeFactor) || 2.5;

  updatedCard.lastReviewDate = currentDateStr;

  switch (rating) {
    case 1: // Quên (Again)
      // Đưa số lần lặp về 0, ôn lại vào ngày mai (hoặc phiên học tới)
      reps = 0;
      interval = 1;
      // Giảm độ dễ
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      updatedCard.status = "learning";
      break;

    case 2: // Khó (Hard)
      // Tăng nhẹ số lần lặp, tăng khoảng cách ít hơn bình thường
      reps += 1;
      if (reps === 1) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round((interval || 1) * 1.2));
      }
      // Giảm nhẹ độ dễ
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      updatedCard.status = "review";
      break;

    case 3: // Được (Good)
      // Khoảng cách theo chuẩn SM-2
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      reps += 1;
      // Giữ nguyên hoặc điều chỉnh nhẹ easeFactor
      updatedCard.status = "review";
      break;

    case 4: // Dễ (Easy)
      // Thưởng khoảng cách xa hơn
      if (reps === 0) {
        interval = 2;
      } else if (reps === 1) {
        interval = 4;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      reps += 1;
      // Tăng hệ số dễ
      easeFactor = Math.min(3.5, easeFactor + 0.15);
      updatedCard.status = "review";
      break;

    default:
      console.warn("Rating không hợp lệ (cần từ 1 đến 4):", rating);
      return updatedCard;
  }

  // Làm tròn hệ số easeFactor đến 2 chữ số thập phân
  easeFactor = Math.round(easeFactor * 100) / 100;

  updatedCard.reps = reps;
  updatedCard.interval = interval;
  updatedCard.easeFactor = easeFactor;
  updatedCard.nextReviewDate = addDays(currentDateStr, interval);

  return updatedCard;
}

/**
 * Kiểm tra xem thẻ có đến hạn ôn tập hôm nay không
 * @param {Object} card
 * @param {string} [todayStr]
 * @returns {boolean}
 */
export function isCardDue(card, todayStr = formatDate()) {
  if (card.status === "new") return false;
  if (!card.nextReviewDate) return true;
  return card.nextReviewDate <= todayStr;
}

/**
 * Lấy nhãn mô tả thời gian ôn tiếp theo dạng tiếng Việt
 * @param {number} interval
 * @returns {string}
 */
export function getIntervalBadgeText(interval) {
  if (interval <= 0) return "Hôm nay";
  if (interval === 1) return "1 ngày nữa";
  if (interval < 30) return `${interval} ngày nữa`;
  const months = Math.round(interval / 30);
  return `${months} tháng nữa`;
}
