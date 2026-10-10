/**
 * WebFlashCard - Ứng Dụng Học Từ Vựng Song Ngữ Thông Minh (Client Controller)
 * Quản lý xác thực, chuyển đổi giao diện, bộ thẻ, tải file, xem trước thẻ,
 * 4 chế độ học tập (Flashcard, Quiz, Typing), Focus Mode và biểu đồ thống kê 7 ngày.
 */

import { speakText, showToast } from './speech.js';

class FlashcardWebApp {
  constructor() {
    this.currentUser = null;
    this.currentLang = 'en'; // 'en' | 'zh'
    this.currentView = 'home'; // 'home' | 'study' | 'library' | 'stats'
    this.currentStudyMode = 'new'; // 'new' | 'review' | 'quiz' | 'typing'
    
    // Quản lý bộ thẻ và phiên học
    this.decks = [];
    this.currentDeckId = null;
    this.studySession = {
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      correctCount: 0,
      totalCount: 0
    };

    // Quản lý xem trước tài liệu tải lên
    this.pendingUpload = {
      uploadId: null,
      cards: []
    };

    // Khởi tạo các sự kiện và trạng thái ban đầu
    this.init();
  }

  /**
   * Khởi chạy ứng dụng
   */
  async init() {
    this.bindDOMEvents();
    this.bindKeyboardShortcuts();
    this.bindSwipeGestures();

    // Thiết lập ngôn ngữ & theme mặc định (Tiếng Anh)
    this.setLanguage('en');

    // Kiểm tra phiên đăng nhập người dùng từ cookie JWT httpOnly
    await this.checkAuthStatus();

    // Tải dữ liệu ban đầu
    await this.loadDecks();
    await this.loadStats();
  }

  /**
   * Trợ thủ gọi API backend có gửi kèm Cookie JWT
   */
  async apiCall(endpoint, options = {}) {
    try {
      // Tự động phát hiện URL backend nếu chạy độc lập (Vite localhost:5173, Live Server localhost:5500)
      let baseUrl = '';
      if (typeof window !== 'undefined') {
        if (window.__API_BASE__) {
          baseUrl = window.__API_BASE__;
        } else if (window.location.port && window.location.port !== '3000' && window.location.protocol.startsWith('http')) {
          baseUrl = `http://${window.location.hostname}:3000`;
        }
      }

      const targetUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
      const headers = { ...(options.headers || {}) };

      // Gửi token dự phòng từ localStorage nếu có
      const storedToken = localStorage.getItem('webflashcard_jwt');
      if (storedToken && !headers['Authorization'] && !headers['authorization']) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const fetchOptions = {
        credentials: 'include',
        ...options,
        headers
      };

      if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
      }

      const res = await fetch(targetUrl, fetchOptions);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || `Yêu cầu thất bại (${res.status})`);
      }

      return data;
    } catch (err) {
      console.warn(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  }

  // =========================================================================
  // 1. QUẢN LÝ XÁC THỰC NGƯỜI DÙNG (AUTH)
  // =========================================================================

  async checkAuthStatus() {
    try {
      const data = await this.apiCall('/api/auth/me');
      if (data && data.user) {
        this.currentUser = data.user;
        this.renderAuthUI();
      } else {
        this.currentUser = null;
        this.renderAuthUI();
      }
    } catch {
      this.currentUser = null;
      this.renderAuthUI();
    }
  }

  renderAuthUI() {
    const userBar = document.getElementById('user-profile-bar');
    const authActionsBar = document.getElementById('auth-actions-bar');
    const userNameSpan = document.getElementById('user-display-name');
    const landingHero = document.getElementById('landing-hero');

    if (this.currentUser) {
      if (userBar) userBar.style.display = 'flex';
      if (authActionsBar) authActionsBar.style.display = 'none';
      const name = this.currentUser.displayName || this.currentUser.name || this.currentUser.email;
      if (userNameSpan) userNameSpan.textContent = name;
      if (landingHero) landingHero.style.display = 'none';
    } else {
      if (userBar) userBar.style.display = 'none';
      if (authActionsBar) authActionsBar.style.display = 'flex';
      if (landingHero) landingHero.style.display = 'block';
    }
  }

  async handleLogin(email, password, rememberMe) {
    const errorMsg = document.getElementById('login-error-msg');
    const submitBtn = document.querySelector('#form-login button[type="submit"]');
    if (errorMsg) {
      errorMsg.style.display = 'none';
      errorMsg.textContent = '';
    }

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang đăng nhập...';
    }

    try {
      const res = await this.apiCall('/api/auth/login', {
        method: 'POST',
        body: { email, password, rememberMe }
      });

      if (res.token) {
        localStorage.setItem('webflashcard_jwt', res.token);
      }

      this.currentUser = res.user;
      this.renderAuthUI();
      this.closeModal('login-modal');
      const displayName = this.currentUser.displayName || this.currentUser.name || this.currentUser.email;
      showToast(`Chào mừng bạn trở lại, ${displayName}!`, 'success');
      
      await this.loadDecks();
      await this.loadStats();
    } catch (err) {
      if (errorMsg) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = 'block';
      }
      showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  }

  async handleRegister(name, email, password) {
    const errorMsg = document.getElementById('register-error-msg');
    const submitBtn = document.querySelector('#form-register button[type="submit"]');
    if (errorMsg) {
      errorMsg.style.display = 'none';
      errorMsg.textContent = '';
    }

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang đăng ký...';
    }

    try {
      const res = await this.apiCall('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });

      if (res.token) {
        localStorage.setItem('webflashcard_jwt', res.token);
      }

      this.currentUser = res.user;
      this.renderAuthUI();
      this.closeModal('register-modal');
      const displayName = this.currentUser.displayName || this.currentUser.name || this.currentUser.email;
      showToast(`Chào mừng ${displayName}! Đăng ký thành công.`, 'success');

      await this.loadDecks();
      await this.loadStats();
    } catch (err) {
      if (errorMsg) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = 'block';
      }
      showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  }

  async handleLogout() {
    try {
      await this.apiCall('/api/auth/logout', { method: 'POST' });
    } catch {
      // Bỏ qua lỗi nếu phiên đã hết hạn
    }
    localStorage.removeItem('webflashcard_jwt');
    this.currentUser = null;
    this.renderAuthUI();
    showToast('Đã đăng xuất thành công.', 'info');
    await this.loadDecks();
    await this.loadStats();
    this.switchView('home');
  }

  // =========================================================================
  // 2. CHUYỂN ĐỔI NGÔN NGỮ & GIAO DIỆN THEO CHỦ ĐỀ (THEME)
  // =========================================================================

  setLanguage(lang) {
    this.currentLang = lang;
    
    // Cập nhật Theme Tokens thông qua thuộc tính HTML & Body
    document.documentElement.setAttribute('data-theme', lang);
    document.body.setAttribute('data-lang', lang);

    // Cập nhật trạng thái active trên các nút chọn ngôn ngữ
    const tabEn = document.getElementById('tab-lang-en');
    const tabZh = document.getElementById('tab-lang-zh');
    if (tabEn) tabEn.classList.toggle('active', lang === 'en');
    if (tabZh) tabZh.classList.toggle('active', lang === 'zh');

    // Đồng bộ vào Form tải tài liệu và tạo bộ thẻ
    const uploadLangSelect = document.getElementById('upload-lang-select');
    if (uploadLangSelect) uploadLangSelect.value = lang;

    const deckLangInput = document.getElementById('deck-lang-input');
    if (deckLangInput) deckLangInput.value = lang;

    // Tải lại danh sách bộ thẻ phù hợp với ngôn ngữ
    this.loadDecks();
  }

  // =========================================================================
  // 3. ĐIỀU HƯỚNG VIEW (HOME / STUDY / LIBRARY / STATS)
  // =========================================================================

  switchView(viewName) {
    this.currentView = viewName;

    // Ẩn tất cả các màn hình
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = 'none';
    });

    // Hiển thị màn hình được chọn
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.style.display = 'block';

    // Cập nhật trạng thái active trên thanh điều hướng Bottom Nav / Sidebar
    document.querySelectorAll('.nav-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Làm mới dữ liệu theo view
    if (viewName === 'home') {
      this.loadDecks();
      this.loadStats();
    } else if (viewName === 'study') {
      this.startStudySession(this.currentStudyMode);
    } else if (viewName === 'library') {
      this.renderLibraryView();
    } else if (viewName === 'stats') {
      this.loadDetailedStats();
    }
  }

  // =========================================================================
  // 4. QUẢN LÝ BỘ THẺ & TẢI TÀI LIỆU (LIBRARY & PREVIEW)
  // =========================================================================

  async loadDecks() {
    try {
      const data = await this.apiCall(`/api/decks?lang=${this.currentLang}`);
      this.decks = data.decks || [];
    } catch {
      this.decks = [];
    }

    this.renderHomeDecks();
    this.populateStudyDeckSelect();
    if (this.currentView === 'library') {
      this.renderLibraryView();
    }
  }

  renderHomeDecks() {
    const container = document.getElementById('home-decks-list');
    if (!container) return;

    if (this.decks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <span>Chưa có bộ thẻ nào cho ${this.currentLang === 'en' ? 'Tiếng Anh' : 'Tiếng Trung'}.</span>
          <br>
          <button type="button" class="btn btn-sm btn-primary" style="margin-top: 0.75rem;" id="btn-home-create-deck">➕ Tạo bộ thẻ hoặc Tải tài liệu lên</button>
        </div>
      `;
      const btn = document.getElementById('btn-home-create-deck');
      if (btn) btn.onclick = () => this.switchView('library');
      return;
    }

    container.innerHTML = this.decks.map(deck => `
      <div class="deck-item-card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div>
          <div style="font-weight: 700; font-size: 1.05rem;">${this.escapeHtml(deck.name)}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${deck.totalCards || 0} thẻ • ${deck.dueCards || 0} thẻ cần ôn
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-primary btn-study-this-deck" data-deck-id="${deck.id}">
          Học ngay ➔
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-study-this-deck').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentDeckId = Number(btn.getAttribute('data-deck-id'));
        const select = document.getElementById('study-deck-select');
        if (select) select.value = this.currentDeckId;
        this.switchView('study');
      });
    });
  }

  populateStudyDeckSelect() {
    const select = document.getElementById('study-deck-select');
    if (!select) return;

    select.innerHTML = '';
    if (this.decks.length === 0) {
      select.innerHTML = '<option value="">(Chưa có bộ thẻ)</option>';
      this.currentDeckId = null;
      return;
    }

    this.decks.forEach(deck => {
      const opt = document.createElement('option');
      opt.value = deck.id;
      opt.textContent = `${deck.name} (${deck.totalCards || 0} thẻ)`;
      select.appendChild(opt);
    });

    if (!this.currentDeckId || !this.decks.some(d => d.id === this.currentDeckId)) {
      this.currentDeckId = this.decks[0].id;
    }
    select.value = this.currentDeckId;
  }

  async renderLibraryView() {
    const decksContainer = document.getElementById('library-decks-table-container');
    const uploadsContainer = document.getElementById('library-uploads-list');

    if (decksContainer) {
      if (this.decks.length === 0) {
        decksContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1.5rem 0;">Bạn chưa có bộ thẻ nào.</p>';
      } else {
        decksContainer.innerHTML = `
          <div style="display: grid; gap: 0.75rem;">
            ${this.decks.map(deck => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div>
                  <strong style="font-size: 1rem;">${this.escapeHtml(deck.name)}</strong>
                  <span class="badge" style="margin-left: 0.5rem; background: var(--bg-tertiary);">${deck.lang.toUpperCase()}</span>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                    ${deck.totalCards || 0} thẻ • ${deck.description ? this.escapeHtml(deck.description) : 'Không có mô tả'}
                  </div>
                </div>
                <div style="display: flex; gap: 0.4rem;">
                  <button type="button" class="btn btn-sm btn-outline btn-edit-deck" data-deck-id="${deck.id}" data-deck-name="${this.escapeHtml(deck.name)}" data-deck-desc="${this.escapeHtml(deck.description || '')}">✏️ Sửa</button>
                  <button type="button" class="btn btn-sm btn-outline btn-delete-deck" style="color: var(--color-danger);" data-deck-id="${deck.id}">🗑️ Xóa</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        decksContainer.querySelectorAll('.btn-edit-deck').forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute('data-deck-id');
            const name = btn.getAttribute('data-deck-name');
            const desc = btn.getAttribute('data-deck-desc');
            this.openDeckModal('edit', { id, name, desc });
          };
        });

        decksContainer.querySelectorAll('.btn-delete-deck').forEach(btn => {
          btn.onclick = async () => {
            const id = btn.getAttribute('data-deck-id');
            if (confirm('Bạn có chắc chắn muốn xóa bộ thẻ này cùng toàn bộ các thẻ bên trong?')) {
              try {
                await this.apiCall(`/api/decks/${id}`, { method: 'DELETE' });
                showToast('Đã xóa bộ thẻ thành công.', 'success');
                await this.loadDecks();
                await this.loadStats();
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          };
        });
      }
    }

    // Tải danh sách file đã tải lên
    if (uploadsContainer) {
      try {
        const upData = await this.apiCall('/api/uploads');
        const uploads = upData.uploads || [];
        if (uploads.length === 0) {
          uploadsContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem 0;">Chưa có tài liệu nào được tải lên.</p>';
        } else {
          uploadsContainer.innerHTML = `
            <div style="display: grid; gap: 0.5rem;">
              ${uploads.map(up => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.875rem;">
                  <div>
                    <strong>📄 ${this.escapeHtml(up.original_name)}</strong>
                    <span class="text-muted" style="font-size: 0.75rem; margin-left: 0.5rem;">(${Math.round(up.file_size / 1024)} KB) • ${up.card_count || 0} thẻ</span>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline btn-delete-upload" style="color: var(--color-danger);" data-upload-id="${up.id}">Xóa file</button>
                </div>
              `).join('')}
            </div>
          `;

          uploadsContainer.querySelectorAll('.btn-delete-upload').forEach(btn => {
            btn.onclick = async () => {
              const id = btn.getAttribute('data-upload-id');
              if (confirm('Xóa tệp tài liệu này khỏi thư viện?')) {
                try {
                  await this.apiCall(`/api/uploads/${id}`, { method: 'DELETE' });
                  showToast('Đã xóa tệp tài liệu.', 'info');
                  this.renderLibraryView();
                } catch (err) {
                  showToast(err.message, 'error');
                }
              }
            };
          });
        }
      } catch {
        uploadsContainer.innerHTML = '<p class="text-muted">Không thể tải lịch sử tài liệu.</p>';
      }
    }
  }

  // =========================================================================
  // 5. TẢI TÀI LIỆU LÊN & XEM TRƯỚC (PREVIEW & COMMIT)
  // =========================================================================

  async handleUploadSubmit(form) {
    const fileInput = document.getElementById('doc-file-input');
    const langSelect = document.getElementById('upload-lang-select');
    const deckNameInput = document.getElementById('upload-deck-name');

    if (!fileInput.files || fileInput.files.length === 0) {
      showToast('Vui lòng chọn một tệp tài liệu (.txt, .md, .csv, .xlsx, .docx, .pdf)', 'warning');
      return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước tệp vượt quá giới hạn 10 MB cho phép.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('lang', langSelect.value || this.currentLang);
    formData.append('deckName', deckNameInput.value.trim() || file.name.replace(/\.[^/.]+$/, ''));

    showToast('Đang tải lên và trích xuất từ vựng...', 'info', 2000);

    try {
      const data = await this.apiCall('/api/uploads', {
        method: 'POST',
        body: formData
      });

      this.pendingUpload = {
        uploadId: data.uploadId,
        deckName: data.deckName || deckNameInput.value.trim() || 'Bộ thẻ mới',
        lang: data.lang || langSelect.value,
        cards: data.preview || []
      };

      this.openPreviewModal();
    } catch (err) {
      showToast(`Lỗi khi tải tài liệu: ${err.message}`, 'error');
    }
  }

  openPreviewModal() {
    const modal = document.getElementById('preview-modal');
    const tableBody = document.getElementById('preview-table-body');
    const countsText = document.getElementById('preview-counts-text');
    const checkAll = document.getElementById('preview-check-all');

    if (!tableBody || !modal) return;

    if (this.pendingUpload.cards.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem;">Không nhận diện được từ vựng nào từ tài liệu.</td></tr>';
      if (countsText) countsText.textContent = 'Đã chọn: 0 / 0 thẻ';
    } else {
      tableBody.innerHTML = this.pendingUpload.cards.map((c, idx) => `
        <tr data-index="${idx}">
          <td style="text-align: center;">
            <input type="checkbox" class="preview-row-check" checked data-index="${idx}">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm preview-term-input" value="${this.escapeHtml(c.term || '')}">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm preview-phonetic-input" value="${this.escapeHtml(c.phonetic || '')}" placeholder="pinyin / ipa">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm preview-meaning-input" value="${this.escapeHtml(c.meaning || '')}">
          </td>
        </tr>
      `).join('');

      this.updatePreviewCounts();

      tableBody.querySelectorAll('.preview-row-check').forEach(ck => {
        ck.addEventListener('change', () => this.updatePreviewCounts());
      });

      if (checkAll) {
        checkAll.checked = true;
        checkAll.onchange = () => {
          tableBody.querySelectorAll('.preview-row-check').forEach(ck => {
            ck.checked = checkAll.checked;
          });
          this.updatePreviewCounts();
        };
      }
    }

    this.openModal('preview-modal');
  }

  updatePreviewCounts() {
    const tableBody = document.getElementById('preview-table-body');
    const countsText = document.getElementById('preview-counts-text');
    if (!tableBody || !countsText) return;

    const checks = tableBody.querySelectorAll('.preview-row-check');
    const checked = Array.from(checks).filter(c => c.checked).length;
    countsText.textContent = `Đã chọn: ${checked} / ${checks.length} thẻ`;
  }

  async commitPreviewCards() {
    const tableBody = document.getElementById('preview-table-body');
    if (!tableBody || !this.pendingUpload.uploadId) return;

    const rows = tableBody.querySelectorAll('tr[data-index]');
    const selectedCards = [];

    rows.forEach(row => {
      const check = row.querySelector('.preview-row-check');
      if (check && check.checked) {
        const termInput = row.querySelector('.preview-term-input');
        const phoneticInput = row.querySelector('.preview-phonetic-input');
        const meaningInput = row.querySelector('.preview-meaning-input');

        const term = termInput ? termInput.value.trim() : '';
        const phonetic = phoneticInput ? phoneticInput.value.trim() : '';
        const meaning = meaningInput ? meaningInput.value.trim() : '';

        if (term && meaning) {
          selectedCards.push({ term, phonetic, meaning });
        }
      }
    });

    if (selectedCards.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 thẻ có đầy đủ từ vựng và nghĩa!', 'warning');
      return;
    }

    try {
      await this.apiCall(`/api/uploads/${this.pendingUpload.uploadId}/commit`, {
        method: 'POST',
        body: {
          lang: this.pendingUpload.lang,
          deckName: this.pendingUpload.deckName,
          cards: selectedCards
        }
      });

      this.closeModal('preview-modal');
      showToast(`Đã thêm thành công ${selectedCards.length} thẻ vào bộ thẻ!`, 'success');

      // Tải lại bộ thẻ và chuyển sang học
      await this.loadDecks();
      await this.loadStats();
      this.switchView('study');
    } catch (err) {
      showToast(`Lỗi khi lưu thẻ: ${err.message}`, 'error');
    }
  }

  // =========================================================================
  // 6. PHIÊN HỌC TẬP & CHẾ ĐỘ FOCUS MODE
  // =========================================================================

  async startStudySession(mode = 'new') {
    this.currentStudyMode = mode;

    // Cập nhật toolbar
    document.querySelectorAll('.study-mode-btn').forEach(btn => {
      btn.classList.toggle('btn-primary', btn.getAttribute('data-mode') === mode);
      btn.classList.toggle('btn-outline', btn.getAttribute('data-mode') !== mode);
    });

    // Ẩn tất cả các container học
    const flashcardContainer = document.getElementById('study-flashcard-container');
    const quizContainer = document.getElementById('study-quiz-container');
    const typingContainer = document.getElementById('study-typing-container');
    const emptyState = document.getElementById('study-empty-state');

    if (flashcardContainer) flashcardContainer.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'none';
    if (typingContainer) typingContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    if (!this.currentDeckId && this.decks.length > 0) {
      this.currentDeckId = this.decks[0].id;
    }

    if (!this.currentDeckId) {
      if (emptyState) {
        emptyState.style.display = 'block';
        document.getElementById('study-empty-title').textContent = 'Chưa có bộ thẻ';
        document.getElementById('study-empty-desc').textContent = 'Vui lòng tạo một bộ thẻ mới hoặc tải tài liệu lên trước khi bắt đầu học.';
      }
      return;
    }

    try {
      let endpoint = '';
      if (mode === 'new') {
        endpoint = `/api/study/new?deckId=${this.currentDeckId}&limit=20`;
      } else if (mode === 'review') {
        endpoint = `/api/study/due?deckId=${this.currentDeckId}&limit=30`;
      } else if (mode === 'quiz') {
        endpoint = `/api/study/quiz?deckId=${this.currentDeckId}&limit=15`;
      } else if (mode === 'typing') {
        endpoint = `/api/study/due?deckId=${this.currentDeckId}&limit=20`;
      }

      const data = await this.apiCall(endpoint);
      const cards = data.cards || data.questions || [];

      if (cards.length === 0) {
        if (emptyState) {
          emptyState.style.display = 'block';
          document.getElementById('study-empty-title').textContent = 'Không có thẻ nào!';
          document.getElementById('study-empty-desc').textContent = mode === 'review'
            ? 'Bạn đã ôn hết thẻ cần ôn cho hôm nay. Rất tuyệt vời!'
            : 'Bộ thẻ này hiện chưa có thẻ phù hợp cho lượt này. Hãy thử chế độ khác hoặc thêm thẻ mới.';
        }
        this.exitFocusMode();
        return;
      }

      // Khởi tạo trạng thái phiên học
      this.studySession = {
        cards,
        currentIndex: 0,
        isFlipped: false,
        correctCount: 0,
        totalCount: cards.length
      };

      // Kích hoạt Chế độ Học Tập Trung (Focus Mode)
      this.enterFocusMode();

      // Render thẻ đầu tiên theo chế độ
      if (mode === 'quiz') {
        if (quizContainer) quizContainer.style.display = 'block';
        this.renderQuizQuestion();
      } else if (mode === 'typing') {
        if (typingContainer) typingContainer.style.display = 'block';
        this.renderTypingQuestion();
      } else {
        if (flashcardContainer) flashcardContainer.style.display = 'block';
        this.renderFlashcard();
      }
    } catch (err) {
      showToast(`Không thể tải phiên học: ${err.message}`, 'error');
      if (emptyState) emptyState.style.display = 'block';
    }
  }

  enterFocusMode() {
    document.body.classList.add('focus-mode-active');
    this.updateFocusProgress();
  }

  exitFocusMode() {
    document.body.classList.remove('focus-mode-active');
  }

  updateFocusProgress() {
    const { currentIndex, totalCount } = this.studySession;
    const progressFill = document.getElementById('focus-progress-fill');
    const progressCounter = document.getElementById('focus-progress-counter');

    const pct = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressCounter) progressCounter.textContent = `${currentIndex} / ${totalCount}`;
  }

  // 6.1. Flashcard Renderer
  renderFlashcard() {
    const card = this.studySession.cards[this.studySession.currentIndex];
    if (!card) {
      this.finishStudySession();
      return;
    }

    this.studySession.isFlipped = false;
    const cardEl = document.getElementById('flashcard-element');
    if (cardEl) cardEl.classList.remove('flipped');

    // Mặt trước
    const frontTerm = document.getElementById('card-front-term');
    const frontPhonetic = document.getElementById('card-front-phonetic');
    if (frontTerm) frontTerm.textContent = card.term || '';
    if (frontPhonetic) frontPhonetic.textContent = card.phonetic || (card.pos ? `(${card.pos})` : '');

    // Mặt sau
    const backTerm = document.getElementById('card-back-term');
    const backMeaning = document.getElementById('card-back-meaning');
    const backExample = document.getElementById('card-back-example');
    const backExampleTrans = document.getElementById('card-back-example-trans');
    const backSrs = document.getElementById('card-back-srs-status');

    if (backTerm) backTerm.textContent = card.term || '';
    if (backMeaning) backMeaning.textContent = card.meaning || '';
    if (backExample) backExample.textContent = card.example ? `"${card.example}"` : '';
    if (backExampleTrans) backExampleTrans.textContent = card.example_trans || '';
    if (backSrs) backSrs.textContent = card.interval ? `Khoảng cách hiện tại: ${card.interval} ngày` : 'Thẻ mới';

    this.updateFocusProgress();
  }

  flipCard() {
    const cardEl = document.getElementById('flashcard-element');
    if (!cardEl) return;
    this.studySession.isFlipped = !this.studySession.isFlipped;
    cardEl.classList.toggle('flipped', this.studySession.isFlipped);
  }

  async submitReviewRating(rating) {
    const card = this.studySession.cards[this.studySession.currentIndex];
    if (!card) return;

    try {
      await this.apiCall('/api/study/review', {
        method: 'POST',
        body: {
          cardId: card.id,
          rating: Number(rating),
          studyMode: this.currentStudyMode
        }
      });
    } catch (err) {
      console.warn('Lỗi lưu review SRS:', err);
    }

    this.studySession.currentIndex++;
    if (this.studySession.currentIndex < this.studySession.totalCount) {
      this.renderFlashcard();
    } else {
      this.finishStudySession();
    }
  }

  // 6.2. Quiz Mode Renderer
  renderQuizQuestion() {
    const q = this.studySession.cards[this.studySession.currentIndex];
    if (!q) {
      this.finishStudySession();
      return;
    }

    const questionWord = document.getElementById('quiz-question-word');
    const questionSub = document.getElementById('quiz-question-sub');
    const optionsList = document.getElementById('quiz-options-list');
    const feedbackBox = document.getElementById('quiz-feedback-box');

    if (questionWord) questionWord.textContent = q.term || '';
    if (questionSub) questionSub.textContent = q.phonetic || '';
    if (feedbackBox) {
      feedbackBox.textContent = '';
      feedbackBox.className = 'quiz-feedback';
    }

    if (optionsList) {
      optionsList.innerHTML = (q.options || []).map((opt, i) => `
        <button type="button" class="btn btn-outline quiz-option-btn" data-answer="${this.escapeHtml(opt)}" data-index="${i}">
          <span style="font-weight: 700; margin-right: 0.5rem;">${String.fromCharCode(65 + i)}.</span>
          <span>${this.escapeHtml(opt)}</span>
        </button>
      `).join('');

      optionsList.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.onclick = () => this.handleQuizAnswer(btn, q);
      });
    }

    this.updateFocusProgress();
  }

  async handleQuizAnswer(selectedBtn, question) {
    const chosen = selectedBtn.getAttribute('data-answer');
    const isCorrect = chosen === question.correctMeaning;
    const feedbackBox = document.getElementById('quiz-feedback-box');

    // Vô hiệu hóa click lặp lại
    document.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);

    if (isCorrect) {
      selectedBtn.classList.add('correct');
      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback feedback-correct';
        feedbackBox.textContent = '✅ Chính xác! Rất tốt.';
      }
      this.studySession.correctCount++;
    } else {
      selectedBtn.classList.add('wrong');
      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback feedback-wrong';
        feedbackBox.textContent = `❌ Chưa đúng! Đáp án đúng: "${question.correctMeaning}"`;
      }
      // Đánh dấu nút đúng
      document.querySelectorAll('.quiz-option-btn').forEach(b => {
        if (b.getAttribute('data-answer') === question.correctMeaning) {
          b.classList.add('correct');
        }
      });
    }

    // Gửi kết quả đánh giá (Đúng: 4, Sai: 1)
    try {
      await this.apiCall('/api/study/review', {
        method: 'POST',
        body: {
          cardId: question.id,
          rating: isCorrect ? 4 : 1,
          studyMode: 'quiz'
        }
      });
    } catch {
      // bỏ qua
    }

    // Tự động chuyển câu sau 1.2s
    setTimeout(() => {
      this.studySession.currentIndex++;
      if (this.studySession.currentIndex < this.studySession.totalCount) {
        this.renderQuizQuestion();
      } else {
        this.finishStudySession();
      }
    }, 1200);
  }

  // 6.3. Typing Mode Renderer
  renderTypingQuestion() {
    const card = this.studySession.cards[this.studySession.currentIndex];
    if (!card) {
      this.finishStudySession();
      return;
    }

    const promptMeaning = document.getElementById('typing-prompt-meaning');
    const promptHint = document.getElementById('typing-prompt-hint');
    const input = document.getElementById('typing-user-input');
    const feedbackBox = document.getElementById('typing-feedback-box');
    const btnCheck = document.getElementById('btn-typing-check');
    const btnNext = document.getElementById('btn-typing-next');

    if (promptMeaning) promptMeaning.textContent = card.meaning || '';
    if (promptHint) {
      const hint = card.phonetic ? `Phiên âm: ${card.phonetic}` : `Từ bắt đầu bằng "${card.term ? card.term[0] : ''}..."`;
      promptHint.textContent = hint;
    }

    if (input) {
      input.value = '';
      input.disabled = false;
      input.focus();
    }

    if (feedbackBox) {
      feedbackBox.textContent = '';
      feedbackBox.className = 'quiz-feedback';
    }

    if (btnCheck) btnCheck.style.display = 'inline-block';
    if (btnNext) btnNext.style.display = 'none';

    this.updateFocusProgress();
  }

  async handleTypingSubmit() {
    const card = this.studySession.cards[this.studySession.currentIndex];
    const input = document.getElementById('typing-user-input');
    const feedbackBox = document.getElementById('typing-feedback-box');
    const btnCheck = document.getElementById('btn-typing-check');
    const btnNext = document.getElementById('btn-typing-next');

    if (!card || !input) return;

    const userVal = input.value.trim().toLowerCase();
    const correctTerm = (card.term || '').trim().toLowerCase();
    const correctPhonetic = (card.phonetic || '').trim().toLowerCase();

    // Chấp nhận nếu gõ đúng từ hoặc đúng pinyin
    const isCorrect = userVal === correctTerm || (card.phonetic && userVal === correctPhonetic);

    input.disabled = true;
    if (btnCheck) btnCheck.style.display = 'none';
    if (btnNext) btnNext.style.display = 'inline-block';

    if (isCorrect) {
      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback feedback-correct';
        feedbackBox.textContent = `✅ Chính xác! Từ đúng: "${card.term}"`;
      }
      this.studySession.correctCount++;
    } else {
      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback feedback-wrong';
        feedbackBox.textContent = `❌ Chưa chính xác! Đáp án đúng: "${card.term}" ${card.phonetic ? `(${card.phonetic})` : ''}`;
      }
    }

    // Tự động phát âm từ vựng
    speakText(card.term, this.currentLang);

    // Gửi đánh giá SRS
    try {
      await this.apiCall('/api/study/review', {
        method: 'POST',
        body: {
          cardId: card.id,
          rating: isCorrect ? 4 : 1,
          studyMode: 'typing'
        }
      });
    } catch {
      // bỏ qua
    }
  }

  advanceTypingNext() {
    this.studySession.currentIndex++;
    if (this.studySession.currentIndex < this.studySession.totalCount) {
      this.renderTypingQuestion();
    } else {
      this.finishStudySession();
    }
  }

  finishStudySession() {
    this.exitFocusMode();

    const flashcardContainer = document.getElementById('study-flashcard-container');
    const quizContainer = document.getElementById('study-quiz-container');
    const typingContainer = document.getElementById('study-typing-container');
    const emptyState = document.getElementById('study-empty-state');

    if (flashcardContainer) flashcardContainer.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'none';
    if (typingContainer) typingContainer.style.display = 'none';

    if (emptyState) {
      emptyState.style.display = 'block';
      document.getElementById('study-empty-title').textContent = 'Hoàn thành phiên học!';
      document.getElementById('study-empty-desc').textContent = `Bạn đã hoàn thành toàn bộ ${this.studySession.totalCount} thẻ trong lượt này. Dữ liệu đã được lưu vào hệ thống lặp lại ngắt quãng SM-2!`;
    }

    // Làm mới thống kê
    this.loadStats();
  }

  // =========================================================================
  // 7. THỐNG KÊ & BIỂU ĐỒ 7 NGÀY
  // =========================================================================

  async loadStats() {
    try {
      const data = await this.apiCall('/api/stats');
      if (!data) return;

      const { totalCards = 0, learnedCards = 0, dueCards = 0, streakDays = 0, accuracy = 100 } = data;

      // Cập nhật số liệu trên Home Dashboard
      const homeLearned = document.getElementById('home-stat-learned');
      const homeDue = document.getElementById('home-stat-due');
      const homeStreak = document.getElementById('home-stat-streak');
      const homeAccuracy = document.getElementById('home-stat-accuracy');

      if (homeLearned) homeLearned.textContent = learnedCards;
      if (homeDue) homeDue.textContent = dueCards;
      if (homeStreak) homeStreak.textContent = `${streakDays} ngày`;
      if (homeAccuracy) homeAccuracy.textContent = `${accuracy}%`;

      // Cập nhật số liệu trên trang Thống Kê
      const statsTotal = document.getElementById('stats-total-cards');
      const statsLearned = document.getElementById('stats-learned-cards');
      const statsDue = document.getElementById('stats-due-cards');
      const statsStreak = document.getElementById('stats-streak-days');

      if (statsTotal) statsTotal.textContent = totalCards;
      if (statsLearned) statsLearned.textContent = learnedCards;
      if (statsDue) statsDue.textContent = dueCards;
      if (statsStreak) statsStreak.textContent = `${streakDays} ngày`;

      // Nhắc nhở học tập trong app
      const reminderBanner = document.getElementById('daily-reminder-banner');
      const reminderText = document.getElementById('reminder-msg-text');
      if (reminderBanner && reminderText) {
        if (dueCards > 0) {
          reminderBanner.style.display = 'flex';
          reminderText.textContent = `Bạn có ${dueCards} thẻ cần ôn tập hôm nay!`;
        } else {
          reminderBanner.style.display = 'none';
        }
      }
    } catch {
      // Bỏ qua nếu chưa có dữ liệu
    }
  }

  async loadDetailedStats() {
    await this.loadStats();

    // Tải dữ liệu biểu đồ 7 ngày
    try {
      const data = await this.apiCall('/api/stats/activity-7d');
      const days = data.days || [];
      const chartContainer = document.getElementById('stats-7d-chart');
      const totalReviewsSpan = document.getElementById('stats-chart-total-reviews');

      if (!chartContainer) return;

      const totalReviews = days.reduce((sum, d) => sum + (d.reviews || 0), 0);
      if (totalReviewsSpan) totalReviewsSpan.textContent = `${totalReviews} lượt ôn`;

      const maxReviews = Math.max(...days.map(d => d.reviews || 0), 10);

      chartContainer.innerHTML = days.map(d => {
        const heightPct = Math.min(100, Math.round(((d.reviews || 0) / maxReviews) * 100));
        return `
          <div class="stats-bar-col" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
            <span class="stats-bar-val" style="font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; color: var(--color-primary);">${d.reviews || 0}</span>
            <div class="stats-bar-track" style="width: 100%; max-width: 36px; height: 120px; background: var(--bg-tertiary); border-radius: var(--radius-sm); display: flex; align-items: flex-end;">
              <div class="stats-bar-fill" style="width: 100%; height: ${heightPct}%; background: var(--color-primary); border-radius: var(--radius-sm); transition: height var(--transition-normal);"></div>
            </div>
            <span class="stats-bar-label" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">${d.label || d.date}</span>
          </div>
        `;
      }).join('');
    } catch {
      // Bỏ qua
    }
  }

  // =========================================================================
  // 8. BIND SỰ KIỆN GIAO DIỆN & MODAL
  // =========================================================================

  bindDOMEvents() {
    // Chuyển ngôn ngữ
    const tabEn = document.getElementById('tab-lang-en');
    const tabZh = document.getElementById('tab-lang-zh');
    if (tabEn) tabEn.onclick = () => this.setLanguage('en');
    if (tabZh) tabZh.onclick = () => this.setLanguage('zh');

    // Hero banner chọn ngôn ngữ
    document.querySelectorAll('.btn-hero-lang').forEach(btn => {
      btn.onclick = () => {
        const lang = btn.getAttribute('data-lang');
        this.setLanguage(lang);
        this.switchView('study');
      };
    });

    // Điều hướng Bottom Nav & Sidebar
    document.querySelectorAll('.nav-view-btn').forEach(btn => {
      btn.onclick = () => this.switchView(btn.getAttribute('data-view'));
    });

    // Auth buttons
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnOpenRegister = document.getElementById('btn-open-register');
    const btnLogout = document.getElementById('btn-logout');

    if (btnOpenLogin) btnOpenLogin.onclick = () => this.openModal('login-modal');
    if (btnOpenRegister) btnOpenRegister.onclick = () => this.openModal('register-modal');
    if (btnLogout) btnLogout.onclick = () => this.handleLogout();

    const switchReg = document.getElementById('btn-switch-to-register');
    if (switchReg) {
      switchReg.onclick = () => {
        this.closeModal('login-modal');
        this.openModal('register-modal');
      };
    }

    const switchLogin = document.getElementById('btn-switch-to-login');
    if (switchLogin) {
      switchLogin.onclick = () => {
        this.closeModal('register-modal');
        this.openModal('login-modal');
      };
    }

    const forgotLink = document.getElementById('link-forgot-pass');
    if (forgotLink) {
      forgotLink.onclick = (e) => {
        e.preventDefault();
        this.closeModal('login-modal');
        this.openModal('forgot-modal');
      };
    }

    // Form submit handlers
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('login-remember-me').checked;
        this.handleLogin(email, password, remember);
      };
    }

    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        this.handleRegister(name, email, password);
      };
    }

    // Modal close buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.onclick = () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) this.closeModal(modalId);
      };
    });

    // Tạo & Sửa bộ thẻ
    const btnCreateDeckModal = document.getElementById('btn-create-deck-modal');
    const btnQuickNewDeck = document.getElementById('btn-quick-new-deck');
    if (btnCreateDeckModal) btnCreateDeckModal.onclick = () => this.openDeckModal('create');
    if (btnQuickNewDeck) btnQuickNewDeck.onclick = () => this.openDeckModal('create');

    const formDeck = document.getElementById('form-deck');
    if (formDeck) {
      formDeck.onsubmit = async (e) => {
        e.preventDefault();
        const deckId = document.getElementById('deck-modal-id').value;
        const name = document.getElementById('deck-name-input').value.trim();
        const lang = document.getElementById('deck-lang-input').value;
        const description = document.getElementById('deck-desc-input').value.trim();

        try {
          if (deckId) {
            await this.apiCall(`/api/decks/${deckId}`, {
              method: 'PUT',
              body: { name, description }
            });
            showToast('Đã cập nhật tên bộ thẻ.', 'success');
          } else {
            await this.apiCall('/api/decks', {
              method: 'POST',
              body: { name, lang, description }
            });
            showToast('Tạo bộ thẻ mới thành công!', 'success');
          }
          this.closeModal('deck-modal');
          await this.loadDecks();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
    }

    // Tải lên tài liệu kéo thả & chọn tệp
    const dropzone = document.getElementById('dropzone-box');
    const fileInput = document.getElementById('doc-file-input');
    const uploadForm = document.getElementById('upload-doc-form');

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();
      fileInput.onchange = () => {
        if (fileInput.files.length > 0) {
          const dropText = document.getElementById('dropzone-text');
          if (dropText) dropText.textContent = `Đã chọn: ${fileInput.files[0].name}`;
        }
      };

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--color-primary)';
      };
      dropzone.ondragleave = () => {
        dropzone.style.borderColor = 'var(--border-color)';
      };
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          const dropText = document.getElementById('dropzone-text');
          if (dropText) dropText.textContent = `Đã chọn: ${fileInput.files[0].name}`;
        }
      };
    }

    if (uploadForm) {
      uploadForm.onsubmit = (e) => {
        e.preventDefault();
        this.handleUploadSubmit(uploadForm);
      };
    }

    const btnCommitPreview = document.getElementById('btn-commit-preview');
    if (btnCommitPreview) {
      btnCommitPreview.onclick = () => this.commitPreviewCards();
    }

    // Chế độ học & Focus Exit
    const btnExitFocus = document.getElementById('btn-exit-focus');
    if (btnExitFocus) {
      btnExitFocus.onclick = () => {
        this.exitFocusMode();
        this.switchView('home');
      };
    }

    document.querySelectorAll('.study-mode-btn').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-mode');
        this.startStudySession(mode);
      };
    });

    const deckSelect = document.getElementById('study-deck-select');
    if (deckSelect) {
      deckSelect.onchange = () => {
        this.currentDeckId = Number(deckSelect.value);
        this.startStudySession(this.currentStudyMode);
      };
    }

    // Lật thẻ Flashcard
    const flashcardEl = document.getElementById('flashcard-element');
    if (flashcardEl) {
      flashcardEl.onclick = (e) => {
        // Tránh lật thẻ khi bấm nút loa
        if (e.target.closest('#btn-speak-front') || e.target.closest('#btn-speak-back')) return;
        this.flipCard();
      };
    }

    // Phát âm Web Speech API
    const btnSpeakFront = document.getElementById('btn-speak-front');
    const btnSpeakBack = document.getElementById('btn-speak-back');
    const btnQuizAudio = document.getElementById('btn-quiz-audio');
    const btnTypingAudio = document.getElementById('btn-typing-audio');

    if (btnSpeakFront) {
      btnSpeakFront.onclick = (e) => {
        e.stopPropagation();
        const card = this.studySession.cards[this.studySession.currentIndex];
        if (card) speakText(card.term, this.currentLang);
      };
    }

    if (btnSpeakBack) {
      btnSpeakBack.onclick = (e) => {
        e.stopPropagation();
        const card = this.studySession.cards[this.studySession.currentIndex];
        if (card) speakText(card.example || card.term, this.currentLang);
      };
    }

    if (btnQuizAudio) {
      btnQuizAudio.onclick = () => {
        const card = this.studySession.cards[this.studySession.currentIndex];
        if (card) speakText(card.term, this.currentLang);
      };
    }

    if (btnTypingAudio) {
      btnTypingAudio.onclick = () => {
        const card = this.studySession.cards[this.studySession.currentIndex];
        if (card) speakText(card.term, this.currentLang);
      };
    }

    // 4 Nút đánh giá ngón cái (Thumb-reach)
    document.querySelectorAll('.rating-btn').forEach(btn => {
      btn.onclick = () => {
        const rating = btn.getAttribute('data-rating');
        this.submitReviewRating(rating);
      };
    });

    // Form điền từ (Typing)
    const typingForm = document.getElementById('typing-submit-form');
    if (typingForm) {
      typingForm.onsubmit = (e) => {
        e.preventDefault();
        const btnNext = document.getElementById('btn-typing-next');
        if (btnNext && btnNext.style.display !== 'none') {
          this.advanceTypingNext();
        } else {
          this.handleTypingSubmit();
        }
      };
    }

    const btnTypingNext = document.getElementById('btn-typing-next');
    if (btnTypingNext) {
      btnTypingNext.onclick = () => this.advanceTypingNext();
    }

    // Empty state buttons
    const btnStudySwitchQuiz = document.getElementById('btn-study-switch-quiz');
    const btnStudyBackHome = document.getElementById('btn-study-back-home');
    if (btnStudySwitchQuiz) btnStudySwitchQuiz.onclick = () => this.startStudySession('quiz');
    if (btnStudyBackHome) btnStudyBackHome.onclick = () => this.switchView('home');

    // Reminder banner
    const btnReminderStudy = document.getElementById('btn-reminder-study');
    const btnDismissReminder = document.getElementById('btn-dismiss-reminder');
    if (btnReminderStudy) {
      btnReminderStudy.onclick = () => {
        this.switchView('study');
        this.startStudySession('review');
      };
    }
    if (btnDismissReminder) {
      btnDismissReminder.onclick = () => {
        const banner = document.getElementById('daily-reminder-banner');
        if (banner) banner.style.display = 'none';
      };
    }
  }

  // =========================================================================
  // 9. CỬ CHỈ CẢM ỨNG VUỐT (SWIPE GESTURES)
  // =========================================================================

  bindSwipeGestures() {
    const flashcardStage = document.querySelector('.flashcard-stage');
    if (!flashcardStage) return;

    let touchStartX = 0;
    let touchStartY = 0;

    flashcardStage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    flashcardStage.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        // Vuốt lên -> Lật thẻ
        if (diffY < -40 && Math.abs(diffX) < 60) {
          this.flipCard();
          return;
        }

        // Vuốt sang trái -> Đánh giá 1 (Quên)
        if (diffX < -60 && Math.abs(diffY) < 60) {
          this.submitReviewRating(1);
          return;
        }

        // Vuốt sang phải -> Đánh giá 3 (Được)
        if (diffX > 60 && Math.abs(diffY) < 60) {
          this.submitReviewRating(3);
          return;
        }
      }
    }, { passive: true });
  }

  // =========================================================================
  // 10. PHÍM TẮT BÀN PHÍM (KEYBOARD SHORTCUTS)
  // =========================================================================

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Bỏ qua khi đang gõ vào input hoặc textarea
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      // Thoát chế độ học tập trung bằng phím Escape
      if (e.key === 'Escape') {
        if (document.body.classList.contains('focus-mode-active')) {
          this.exitFocusMode();
          this.switchView('home');
          return;
        }
      }

      // Nếu đang trong chế độ Flashcard
      const flashcardContainer = document.getElementById('study-flashcard-container');
      if (flashcardContainer && flashcardContainer.style.display !== 'none') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.flipCard();
          return;
        }

        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          this.submitReviewRating(Number(e.key));
          return;
        }

        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          const card = this.studySession.cards[this.studySession.currentIndex];
          if (card) speakText(card.term, this.currentLang);
          return;
        }
      }
    });
  }

  // =========================================================================
  // 11. HỖ TRỢ MODAL & TIỆN ÍCH
  // =========================================================================

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal-active', 'modal-show');
      // Xóa thông báo lỗi cũ khi mở modal
      const errorMsg = modal.querySelector('#login-error-msg, #register-error-msg');
      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('modal-active', 'modal-show');
    }
  }

  openDeckModal(mode = 'create', data = {}) {
    const modal = document.getElementById('deck-modal');
    const title = document.getElementById('deck-modal-title');
    const idInput = document.getElementById('deck-modal-id');
    const nameInput = document.getElementById('deck-name-input');
    const langSelect = document.getElementById('deck-lang-input');
    const descInput = document.getElementById('deck-desc-input');

    if (!modal) return;

    if (mode === 'edit') {
      if (title) title.textContent = 'Chỉnh Sửa Bộ Thẻ';
      if (idInput) idInput.value = data.id || '';
      if (nameInput) nameInput.value = data.name || '';
      if (descInput) descInput.value = data.desc || '';
      if (langSelect) langSelect.disabled = true;
    } else {
      if (title) title.textContent = 'Tạo Bộ Thẻ Mới';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (langSelect) {
        langSelect.disabled = false;
        langSelect.value = this.currentLang;
      }
    }

    this.openModal('deck-modal');
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.flashcardApp = new FlashcardWebApp();
});
