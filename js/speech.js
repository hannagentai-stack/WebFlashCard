/**
 * Module phát âm sử dụng Web Speech API (speechSynthesis)
 * Hỗ trợ phát âm tiếng Anh (en-US) và tiếng Trung (zh-CN)
 * Kèm hệ thống thông báo Toast nhẹ nhàng khi không hỗ trợ hoặc lỗi
 */

let voices = [];
let voicesLoaded = false;

// Tải danh sách giọng đọc từ trình duyệt
function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
    voicesLoaded = voices.length > 0;
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Phát âm một từ hoặc câu theo ngôn ngữ chỉ định
 * @param {string} text Đoạn văn bản cần đọc
 * @param {'en'|'zh'} lang Ngôn ngữ ('en' hoặc 'zh')
 * @param {number} [rate=0.9] Tốc độ đọc (0.5 đến 1.5, mặc định 0.9 để nghe rõ)
 */
export function speakText(text, lang = 'en', rate = 0.9) {
  if (!text || typeof window === 'undefined') return;

  if (!('speechSynthesis' in window)) {
    showToast('Trình duyệt của bạn không hỗ trợ tính năng phát âm Web Speech API.', 'warning');
    return;
  }

  try {
    // Hủy các câu đọc dở trước đó
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const targetLangCode = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.lang = targetLangCode;

    // Chọn giọng đọc phù hợp nhất trong danh sách giọng có sẵn
    if (!voicesLoaded) loadVoices();

    const matchingVoice = voices.find(v => {
      if (lang === 'zh') {
        return v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('TW');
      } else {
        return v.lang.startsWith('en') && (v.lang.includes('US') || v.lang.includes('GB'));
      }
    });

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onerror = (e) => {
      console.warn('Lỗi khi phát âm:', e);
      // Không cần làm phiền người dùng nếu người dùng chủ động ngắt
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        showToast('Không thể phát âm giọng đọc này trên thiết bị hiện tại.', 'info');
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Ngoại lệ khi gọi phát âm:', err);
    showToast('Có lỗi xảy ra khi phát âm.', 'warning');
  }
}

/**
 * Hiển thị thông báo Toast nhẹ nhàng ở góc màn hình
 * @param {string} message Nội dung thông báo
 * @param {'info'|'success'|'warning'|'error'} [type='info']
 * @param {number} [duration=3000] Thời gian hiển thị (ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  // Icon tương ứng
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Kích hoạt animation xuất hiện
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Tự động biến mất
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
