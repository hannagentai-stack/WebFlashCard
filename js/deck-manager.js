/**
 * Quản lý danh sách thẻ (Deck Manager)
 * Các tính năng: Hiển thị bảng thẻ, Tìm kiếm, Lọc, Thêm mới, Sửa, Xóa, Nhập/Xuất CSV và JSON
 */

import {
  getCards,
  addCard,
  updateCard,
  deleteCard,
  exportCardsCSV,
  exportCardsJSON,
  parseCSV,
  saveCards,
  resetToDefault
} from './storage.js';
import { speakText, showToast } from './speech.js';
import { getIntervalBadgeText } from './srs.js';

export class DeckManager {
  constructor(app) {
    this.app = app;
    this.editingCardId = null;
    this.searchQuery = '';
    this.filterStatus = 'all';

    this.bindEvents();
  }

  bindEvents() {
    // Tìm kiếm thẻ
    const searchInput = document.getElementById('deck-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTable();
      });
    }

    // Lọc theo trạng thái
    const filterSelect = document.getElementById('deck-filter-status');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.renderTable();
      });
    }

    // Nút mở modal thêm thẻ mới
    const addCardBtn = document.getElementById('btn-open-add-modal');
    if (addCardBtn) {
      addCardBtn.addEventListener('click', () => {
        this.openCardModal();
      });
    }

    // Nút lưu trong modal thêm/sửa thẻ
    const cardForm = document.getElementById('card-modal-form');
    if (cardForm) {
      cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveModalCard();
      });
    }

    // Nút đóng modal
    const closeBtns = document.querySelectorAll('.btn-close-modal');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeCardModal();
      });
    });

    // Đóng modal khi click ra ngoài overlay
    const modalOverlay = document.getElementById('card-modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeCardModal();
        }
      });
    }

    // Nút Xuất CSV và Xuất JSON
    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        exportCardsCSV(this.app.currentLang);
        showToast('Đã tải xuống file CSV thành công!', 'success');
      });
    }

    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        exportCardsJSON(this.app.currentLang);
        showToast('Đã tải xuống file JSON thành công!', 'success');
      });
    }

    // Nút Nhập file CSV / JSON
    const importFileInput = document.getElementById('import-file-input');
    const importBtn = document.getElementById('btn-trigger-import');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleFileImport(file);
          importFileInput.value = ''; // Reset input để có thể chọn lại cùng 1 file
        }
      });
    }

    // Nút Khôi phục dữ liệu mẫu ban đầu
    const resetBtn = document.getElementById('btn-reset-deck');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const langName = this.app.currentLang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh';
        if (confirm(`Bạn có chắc chắn muốn khôi phục bộ thẻ ${langName} về 30 thẻ mẫu mặc định ban đầu? Tiến độ học tập của bộ này sẽ được đặt lại.`)) {
          resetToDefault(this.app.currentLang);
          this.renderTable();
          this.app.renderStatsDashboard();
          showToast(`Đã khôi phục bộ thẻ ${langName} về mặc định!`, 'success');
        }
      });
    }
  }

  /**
   * Render bảng danh sách thẻ dựa trên ngôn ngữ hiện tại, tìm kiếm và bộ lọc
   */
  renderTable() {
    const lang = this.app.currentLang;
    const cards = getCards(lang);
    const tbody = document.getElementById('deck-table-body');
    const countBadge = document.getElementById('deck-total-count');

    if (!tbody) return;
    tbody.innerHTML = '';

    // Lọc dữ liệu
    const filtered = cards.filter(c => {
      // Lọc trạng thái
      if (this.filterStatus !== 'all' && c.status !== this.filterStatus) {
        return false;
      }

      // Tìm kiếm
      if (this.searchQuery) {
        if (lang === 'zh') {
          const matchHanzi = (c.hanzi || '').toLowerCase().includes(this.searchQuery);
          const matchPinyin = (c.pinyin || '').toLowerCase().includes(this.searchQuery);
          const matchMeaning = (c.meaning || '').toLowerCase().includes(this.searchQuery);
          return matchHanzi || matchPinyin || matchMeaning;
        } else {
          const matchWord = (c.word || '').toLowerCase().includes(this.searchQuery);
          const matchMeaning = (c.meaning || '').toLowerCase().includes(this.searchQuery);
          return matchWord || matchMeaning;
        }
      }

      return true;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} / ${cards.length} thẻ`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            Không tìm thấy thẻ nào phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((card, index) => {
      const tr = document.createElement('tr');

      const primaryWord = lang === 'zh' ? card.hanzi : card.word;
      const phoneticText = lang === 'zh' ? card.pinyin : card.ipa;
      const extraTag = lang === 'zh' ? (card.hskLevel || 'HSK 1') : (card.pos || '');

      let statusBadge = '<span class="badge badge-new">Mới</span>';
      if (card.status === 'learning') {
        statusBadge = '<span class="badge badge-learning">Đang học</span>';
      } else if (card.status === 'review') {
        statusBadge = '<span class="badge badge-review">Đã thuộc</span>';
      }

      const nextReviewText = card.status === 'new'
        ? '-'
        : getIntervalBadgeText(card.interval);

      tr.innerHTML = `
        <td class="text-muted text-center" style="width: 40px;">${index + 1}</td>
        <td>
          <div class="table-word-cell">
            <span class="table-word-main ${lang === 'zh' ? 'font-cjk' : ''}">${escapeHtml(primaryWord || '')}</span>
            <span class="table-word-sub text-muted">${escapeHtml(phoneticText || '')}</span>
            <button type="button" class="btn-icon btn-speak-row" title="Phát âm">🔊</button>
          </div>
        </td>
        <td>
          <span class="table-meaning">${escapeHtml(card.meaning || '')}</span>
          ${card.example ? `<div class="table-example text-muted">"${escapeHtml(card.example)}"</div>` : ''}
        </td>
        <td><span class="badge badge-tag">${escapeHtml(extraTag)}</span></td>
        <td>
          <div class="table-srs-status">
            ${statusBadge}
            <small class="text-muted d-block">${nextReviewText}</small>
          </div>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-sm btn-outline btn-edit-row" data-id="${card.id}" title="Sửa thẻ">✏️ Sửa</button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete-row" data-id="${card.id}" title="Xóa thẻ">🗑️</button>
        </td>
      `;

      // Nút phát âm trên từng dòng
      const speakBtn = tr.querySelector('.btn-speak-row');
      if (speakBtn) {
        speakBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          speakText(primaryWord, lang);
        });
      }

      // Nút sửa
      const editBtn = tr.querySelector('.btn-edit-row');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.openCardModal(card);
        });
      }

      // Nút xóa
      const deleteBtn = tr.querySelector('.btn-delete-row');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Bạn có chắc muốn xóa thẻ "${primaryWord}"?`)) {
            deleteCard(lang, card.id);
            this.renderTable();
            this.app.renderStatsDashboard();
            showToast(`Đã xóa thẻ "${primaryWord}"`, 'info');
          }
        });
      }

      tbody.appendChild(tr);
    });
  }

  /**
   * Mở modal thêm mới hoặc chỉnh sửa thẻ
   * @param {Object} [card]
   */
  openCardModal(card = null) {
    const modal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('card-modal-title');
    const lang = this.app.currentLang;

    this.editingCardId = card ? card.id : null;

    if (modalTitle) {
      modalTitle.textContent = card
        ? `Chỉnh sửa thẻ ${lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'}`
        : `Thêm thẻ ${lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'} mới`;
    }

    // Hiển thị các trường form tương ứng theo ngôn ngữ
    const enFields = document.getElementById('modal-en-fields');
    const zhFields = document.getElementById('modal-zh-fields');

    if (enFields) enFields.style.display = lang === 'en' ? 'block' : 'none';
    if (zhFields) zhFields.style.display = lang === 'zh' ? 'block' : 'none';

    // Đổ dữ liệu vào form
    if (lang === 'zh') {
      document.getElementById('input-zh-hanzi').value = card?.hanzi || '';
      document.getElementById('input-zh-pinyin').value = card?.pinyin || '';
      document.getElementById('input-zh-hsk').value = card?.hskLevel || 'HSK 1';
    } else {
      document.getElementById('input-en-word').value = card?.word || '';
      document.getElementById('input-en-ipa').value = card?.ipa || '';
      document.getElementById('input-en-pos').value = card?.pos || 'noun';
    }

    document.getElementById('input-common-meaning').value = card?.meaning || '';
    document.getElementById('input-common-example').value = card?.example || '';
    document.getElementById('input-common-example-trans').value = card?.exampleTrans || '';

    if (modal) modal.classList.add('modal-active');
  }

  closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.classList.remove('modal-active');
    this.editingCardId = null;
  }

  saveModalCard() {
    const lang = this.app.currentLang;
    const meaning = document.getElementById('input-common-meaning').value.trim();
    const example = document.getElementById('input-common-example').value.trim();
    const exampleTrans = document.getElementById('input-common-example-trans').value.trim();

    if (!meaning) {
      showToast('Vui lòng nhập nghĩa tiếng Việt cho thẻ.', 'warning');
      return;
    }

    let cardData = {
      meaning,
      example,
      exampleTrans
    };

    if (lang === 'zh') {
      const hanzi = document.getElementById('input-zh-hanzi').value.trim();
      const pinyin = document.getElementById('input-zh-pinyin').value.trim();
      const hskLevel = document.getElementById('input-zh-hsk').value.trim() || 'HSK 1';

      if (!hanzi) {
        showToast('Vui lòng nhập chữ Hán.', 'warning');
        return;
      }

      cardData = {
        ...cardData,
        hanzi,
        pinyin,
        hskLevel
      };
    } else {
      const word = document.getElementById('input-en-word').value.trim();
      const ipa = document.getElementById('input-en-ipa').value.trim();
      const pos = document.getElementById('input-en-pos').value.trim() || 'noun';

      if (!word) {
        showToast('Vui lòng nhập từ vựng tiếng Anh.', 'warning');
        return;
      }

      cardData = {
        ...cardData,
        word,
        ipa,
        pos
      };
    }

    if (this.editingCardId) {
      // Cập nhật thẻ cũ
      const existingCards = getCards(lang);
      const originalCard = existingCards.find(c => c.id === this.editingCardId);
      const updated = { ...originalCard, ...cardData };
      updateCard(lang, updated);
      showToast('Đã cập nhật thẻ thành công!', 'success');
    } else {
      // Thêm thẻ mới
      addCard(lang, cardData);
      showToast('Đã thêm thẻ mới thành công!', 'success');
    }

    this.closeCardModal();
    this.renderTable();
    this.app.renderStatsDashboard();
  }

  /**
   * Nhập dữ liệu từ file CSV hoặc JSON do người dùng tải lên
   * @param {File} file
   */
  async handleFileImport(file) {
    const lang = this.app.currentLang;
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    if (!isJson && !isCsv) {
      showToast('Chỉ hỗ trợ file định dạng .csv hoặc .json', 'error');
      return;
    }

    try {
      const text = await file.text();
      let importedCards = [];

      if (isJson) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('Dữ liệu JSON phải là một mảng danh sách thẻ.');
        }
        importedCards = parsed;
      } else {
        importedCards = parseCSV(lang, text);
      }

      if (importedCards.length === 0) {
        showToast('Không tìm thấy thẻ hợp lệ nào trong file.', 'warning');
        return;
      }

      const existingCards = getCards(lang);
      const mode = confirm(`Tìm thấy ${importedCards.length} thẻ trong file.\n\nNhấn "OK" để GHÉP THÊM vào danh sách hiện tại.\nNhấn "Cancel" để THAY THẾ toàn bộ bộ thẻ hiện tại.`)
        ? 'merge'
        : 'replace';

      let finalCards = [];
      if (mode === 'merge') {
        const existingIds = new Set(existingCards.map(c => c.id));
        const newOnes = importedCards.map(c => {
          if (existingIds.has(c.id)) {
            return { ...c, id: `${lang}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
          }
          return c;
        });
        finalCards = [...existingCards, ...newOnes];
      } else {
        finalCards = importedCards;
      }

      saveCards(lang, finalCards);
      this.renderTable();
      this.app.renderStatsDashboard();
      showToast(`Đã nhập thành công ${importedCards.length} thẻ vào bộ thẻ!`, 'success');
    } catch (err) {
      console.error('Lỗi khi đọc file import:', err);
      showToast(`Lỗi khi nhập file: ${err.message}`, 'error');
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
