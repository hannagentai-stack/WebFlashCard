/**
 * Quản lý các chế độ học tập:
 * 1. Học mới (New Cards)
 * 2. Ôn tập (Due Review Cards)
 * 3. Trắc nghiệm (4-choice Quiz)
 * 4. Điền từ (Typing / Fill-in-the-blank)
 */

import { getCards, saveCards, recordReview } from './storage.js';
import { calculateNextReview, formatDate } from './srs.js';
import { speakText, showToast } from './speech.js';

export class StudyController {
  constructor(app) {
    this.app = app;
    this.currentMode = 'new'; // 'new' | 'review' | 'quiz' | 'typing'
    this.queue = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.quizAnswerSelected = false;
    this.typingSubmitted = false;

    // Bộ đếm kết quả phiên học
    this.sessionStats = {
      total: 0,
      completed: 0,
      correct: 0,
      again: 0
    };

    this.bindEvents();
  }

  bindEvents() {
    // Sự kiện lật thẻ khi bấm vào khung thẻ flashcard
    const flashcardEl = document.getElementById('flashcard');
    if (flashcardEl) {
      flashcardEl.addEventListener('click', (e) => {
        // Tránh kích hoạt lật thẻ nếu người dùng bấm vào nút phát âm hoặc nút hành động bên trong
        if (e.target.closest('.card-action-btn') || e.target.closest('.rating-btn')) return;
        this.flipCard();
      });
    }

    // Nút lật thẻ riêng nếu có
    const flipBtn = document.getElementById('btn-flip-card');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => this.flipCard());
    }

    // Các nút đánh giá SM-2 (1 - Quên, 2 - Khó, 3 - Được, 4 - Dễ)
    const ratingButtons = document.querySelectorAll('.rating-btn');
    ratingButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rating = Number(btn.getAttribute('data-rating'));
        this.handleRating(rating);
      });
    });

    // Nút phát âm mặt trước & mặt sau
    const speakFrontBtn = document.getElementById('btn-speak-front');
    if (speakFrontBtn) {
      speakFrontBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakCurrentCard();
      });
    }

    const speakBackBtn = document.getElementById('btn-speak-back');
    if (speakBackBtn) {
      speakBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakCurrentCard();
      });
    }

    // Sự kiện nộp bài điền từ
    const typingForm = document.getElementById('typing-form');
    if (typingForm) {
      typingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTypingSubmit();
      });
    }

    // Nút câu tiếp theo ở chế độ điền từ
    const typingNextBtn = document.getElementById('typing-next-btn');
    if (typingNextBtn) {
      typingNextBtn.addEventListener('click', () => {
        this.nextCard();
      });
    }
  }

  /**
   * Bắt đầu một phiên học theo chế độ đã chọn
   * @param {'new'|'review'|'quiz'|'typing'} mode
   */
  startSession(mode) {
    this.currentMode = mode;
    this.isFlipped = false;
    this.quizAnswerSelected = false;
    this.typingSubmitted = false;

    const lang = this.app.currentLang;
    const allCards = getCards(lang);
    const todayStr = formatDate();

    if (mode === 'new') {
      // Lọc các thẻ chưa học (status === 'new')
      this.queue = allCards.filter(c => c.status === 'new');
    } else if (mode === 'review') {
      // Lọc các thẻ đã học và đến hạn ôn (nextReviewDate <= today)
      this.queue = allCards.filter(c => c.status !== 'new' && (c.nextReviewDate ? c.nextReviewDate <= todayStr : true));
      // Nếu không có thẻ nào đến hạn, cho phép người dùng ôn tập toàn bộ thẻ đã học
      if (this.queue.length === 0) {
        const learned = allCards.filter(c => c.status !== 'new');
        if (learned.length > 0) {
          showToast('Không có thẻ nào đến hạn hôm nay! Chuyển sang ôn luyện ngẫu nhiên các thẻ đã học.', 'info');
          this.queue = [...learned].sort(() => Math.random() - 0.5);
        }
      }
    } else if (mode === 'quiz' || mode === 'typing') {
      // Chế độ trắc nghiệm & điền từ: xáo trộn các thẻ trong bộ để luyện tập
      this.queue = [...allCards].sort(() => Math.random() - 0.5);
    }

    this.currentIndex = 0;
    this.sessionStats = {
      total: this.queue.length,
      completed: 0,
      correct: 0,
      again: 0
    };

    this.renderCurrentView();
  }

  /**
   * Render giao diện tương ứng với chế độ học hiện tại
   */
  renderCurrentView() {
    this.updateProgressBar();

    // Ẩn tất cả các khu vực học
    const flashcardArea = document.getElementById('flashcard-area');
    const quizArea = document.getElementById('quiz-area');
    const typingArea = document.getElementById('typing-area');
    const emptyArea = document.getElementById('empty-study-area');
    const completionArea = document.getElementById('completion-area');

    if (flashcardArea) flashcardArea.style.display = 'none';
    if (quizArea) quizArea.style.display = 'none';
    if (typingArea) typingArea.style.display = 'none';
    if (emptyArea) emptyArea.style.display = 'none';
    if (completionArea) completionArea.style.display = 'none';

    // Trường hợp hàng đợi rỗng ngay từ đầu
    if (this.queue.length === 0) {
      if (emptyArea) {
        emptyArea.style.display = 'flex';
        const msgEl = document.getElementById('empty-study-msg');
        if (msgEl) {
          if (this.currentMode === 'new') {
            msgEl.textContent = 'Tuyệt vời! Bạn đã học hết tất cả thẻ mới trong bộ thẻ này.';
          } else if (this.currentMode === 'review') {
            msgEl.textContent = 'Hôm nay không có thẻ nào cần ôn tập. Hãy thử học thẻ mới hoặc chế độ trắc nghiệm!';
          } else {
            msgEl.textContent = 'Bộ thẻ hiện chưa có từ vựng nào. Hãy thêm thẻ mới để bắt đầu!';
          }
        }
      }
      return;
    }

    // Trường hợp đã hoàn thành tất cả thẻ trong phiên
    if (this.currentIndex >= this.queue.length) {
      this.renderCompletionScreen();
      return;
    }

    const currentCard = this.queue[this.currentIndex];

    if (this.currentMode === 'new' || this.currentMode === 'review') {
      if (flashcardArea) flashcardArea.style.display = 'block';
      this.renderFlashcard(currentCard);
    } else if (this.currentMode === 'quiz') {
      if (quizArea) quizArea.style.display = 'block';
      this.renderQuiz(currentCard);
    } else if (this.currentMode === 'typing') {
      if (typingArea) typingArea.style.display = 'block';
      this.renderTyping(currentCard);
    }
  }

  /**
   * Cập nhật thanh tiến độ phiên học
   */
  updateProgressBar() {
    const progressBar = document.getElementById('session-progress-bar');
    const progressText = document.getElementById('session-progress-text');

    if (this.queue.length === 0) {
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = '0 / 0';
      return;
    }

    const currentNum = Math.min(this.currentIndex + 1, this.queue.length);
    const percent = Math.round((this.currentIndex / this.queue.length) * 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${currentNum} / ${this.queue.length} (${percent}%)`;
  }

  /* ========================================================
   * 1 & 2. CHẾ ĐỘ FLASHCARD (HỌC MỚI & ÔN TẬP)
   * ======================================================== */

  renderFlashcard(card) {
    const flashcardEl = document.getElementById('flashcard');
    if (flashcardEl) {
      flashcardEl.classList.remove('is-flipped');
      this.isFlipped = false;
    }

    // Cập nhật mặt trước
    const frontWord = document.getElementById('card-front-word');
    const frontPhonetic = document.getElementById('card-front-phonetic');
    const frontBadge = document.getElementById('card-front-badge');

    if (card.lang === 'zh') {
      if (frontWord) {
        frontWord.textContent = card.hanzi || '';
        frontWord.className = 'card-title font-cjk';
      }
      if (frontPhonetic) frontPhonetic.textContent = card.pinyin ? `[ ${card.pinyin} ]` : '';
      if (frontBadge) frontBadge.textContent = card.hskLevel || 'HSK 1';
    } else {
      if (frontWord) {
        frontWord.textContent = card.word || '';
        frontWord.className = 'card-title';
      }
      if (frontPhonetic) frontPhonetic.textContent = card.ipa ? `[ ${card.ipa} ]` : '';
      if (frontBadge) frontBadge.textContent = card.pos || 'từ vựng';
    }

    // Cập nhật mặt sau
    const backWord = document.getElementById('card-back-word');
    const backMeaning = document.getElementById('card-back-meaning');
    const backExample = document.getElementById('card-back-example');
    const backExampleTrans = document.getElementById('card-back-example-trans');
    const backSrsInfo = document.getElementById('card-back-srs-info');

    const primaryText = card.lang === 'zh' ? card.hanzi : card.word;
    const secondaryText = card.lang === 'zh' ? card.pinyin : card.ipa;

    if (backWord) backWord.textContent = `${primaryText} ${secondaryText ? `[${secondaryText}]` : ''}`;
    if (backMeaning) backMeaning.textContent = card.meaning || '';
    if (backExample) backExample.textContent = card.example || '';
    if (backExampleTrans) backExampleTrans.textContent = card.exampleTrans || '';

    if (backSrsInfo) {
      if (card.status === 'new') {
        backSrsInfo.textContent = 'Thẻ mới chưa học';
      } else {
        backSrsInfo.textContent = `Đã ôn ${card.reps || 0} lần • Khoảng cách: ${card.interval || 0} ngày • Độ dễ: ${card.easeFactor || 2.5}`;
      }
    }

    // Ẩn thanh đánh giá cho đến khi lật thẻ
    const ratingToolbar = document.getElementById('rating-toolbar');
    if (ratingToolbar) {
      ratingToolbar.style.opacity = '0.35';
      ratingToolbar.style.pointerEvents = 'none';
    }
  }

  flipCard() {
    const flashcardEl = document.getElementById('flashcard');
    if (!flashcardEl) return;

    this.isFlipped = !this.isFlipped;
    flashcardEl.classList.toggle('is-flipped', this.isFlipped);

    const ratingToolbar = document.getElementById('rating-toolbar');
    if (ratingToolbar) {
      if (this.isFlipped) {
        ratingToolbar.style.opacity = '1';
        ratingToolbar.style.pointerEvents = 'auto';
      } else {
        ratingToolbar.style.opacity = '0.35';
        ratingToolbar.style.pointerEvents = 'none';
      }
    }
  }

  handleRating(rating) {
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) return;

    const currentCard = this.queue[this.currentIndex];
    const isSuccess = rating >= 2;

    // Tính toán lại các chỉ số SRS theo thuật toán SM-2
    const updatedCard = calculateNextReview(currentCard, rating);

    // Cập nhật vào kho lưu trữ
    const lang = this.app.currentLang;
    const allCards = getCards(lang);
    const cardIdx = allCards.findIndex(c => c.id === currentCard.id);
    if (cardIdx !== -1) {
      allCards[cardIdx] = updatedCard;
      saveCards(lang, allCards);
    }

    // Cập nhật thống kê streak
    recordReview(isSuccess);

    // Thống kê phiên học
    this.sessionStats.completed++;
    if (isSuccess) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.again++;
      // Nếu người dùng chọn "Quên", đẩy lại thẻ vào cuối hàng đợi phiên học để học lại
      this.queue.push(currentCard);
    }

    this.app.renderStatsDashboard();
    this.nextCard();
  }

  speakCurrentCard() {
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) return;
    const currentCard = this.queue[this.currentIndex];
    const textToSpeak = currentCard.lang === 'zh' ? currentCard.hanzi : currentCard.word;
    speakText(textToSpeak, currentCard.lang);
  }

  nextCard() {
    this.currentIndex++;
    this.isFlipped = false;
    this.quizAnswerSelected = false;
    this.typingSubmitted = false;
    this.renderCurrentView();
  }

  /* ========================================================
   * 3. CHẾ ĐỘ TRẮC NGHIỆM (QUIZ)
   * ======================================================== */

  renderQuiz(card) {
    this.quizAnswerSelected = false;
    const allCards = getCards(this.app.currentLang);

    // Lấy từ vựng hiển thị
    const quizPromptWord = document.getElementById('quiz-prompt-word');
    const quizPromptSub = document.getElementById('quiz-prompt-sub');
    const quizFeedback = document.getElementById('quiz-feedback');
    const quizOptionsContainer = document.getElementById('quiz-options');

    if (quizFeedback) {
      quizFeedback.innerHTML = '';
      quizFeedback.className = 'quiz-feedback';
    }

    if (card.lang === 'zh') {
      if (quizPromptWord) {
        quizPromptWord.textContent = card.hanzi;
        quizPromptWord.className = 'quiz-word font-cjk';
      }
      if (quizPromptSub) quizPromptSub.textContent = `[ ${card.pinyin || ''} ]`;
    } else {
      if (quizPromptWord) {
        quizPromptWord.textContent = card.word;
        quizPromptWord.className = 'quiz-word';
      }
      if (quizPromptSub) quizPromptSub.textContent = `[ ${card.ipa || ''} ] (${card.pos || ''})`;
    }

    // Sinh 4 đáp án: 1 đúng + 3 sai từ các thẻ khác
    const correctAnswer = card.meaning;
    const otherMeanings = allCards
      .filter(c => c.id !== card.id && c.meaning && c.meaning !== correctAnswer)
      .map(c => c.meaning);

    // Xáo trộn và lấy 3 đáp án sai
    const shuffledOthers = otherMeanings.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correctAnswer, ...shuffledOthers].sort(() => Math.random() - 0.5);

    if (quizOptionsContainer) {
      quizOptionsContainer.innerHTML = '';
      options.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span class="opt-index">${String.fromCharCode(65 + index)}.</span> <span class="opt-text">${escapeHtml(optText)}</span>`;
        
        btn.addEventListener('click', () => {
          if (this.quizAnswerSelected) return;
          this.handleQuizSelection(optText, correctAnswer, btn, card);
        });

        quizOptionsContainer.appendChild(btn);
      });
    }

    // Nút phát âm trong quiz
    const quizSpeakBtn = document.getElementById('btn-quiz-speak');
    if (quizSpeakBtn) {
      quizSpeakBtn.onclick = () => {
        speakText(card.lang === 'zh' ? card.hanzi : card.word, card.lang);
      };
    }
  }

  handleQuizSelection(selectedAnswer, correctAnswer, selectedBtn, card) {
    this.quizAnswerSelected = true;
    const isCorrect = selectedAnswer === correctAnswer;
    const optionsContainer = document.getElementById('quiz-options');
    const quizFeedback = document.getElementById('quiz-feedback');

    // Đánh dấu đáp án đúng và sai trên các nút
    if (optionsContainer) {
      const allBtns = optionsContainer.querySelectorAll('.quiz-option-btn');
      allBtns.forEach(btn => {
        const text = btn.querySelector('.opt-text')?.textContent;
        if (text === correctAnswer) {
          btn.classList.add('is-correct');
        }
        if (text === selectedAnswer && !isCorrect) {
          btn.classList.add('is-wrong');
        }
      });
    }

    // Cập nhật SRS và thống kê
    const rating = isCorrect ? 3 : 1;
    const updatedCard = calculateNextReview(card, rating);
    const allCards = getCards(this.app.currentLang);
    const idx = allCards.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      allCards[idx] = updatedCard;
      saveCards(this.app.currentLang, allCards);
    }

    recordReview(isCorrect);
    this.sessionStats.completed++;
    if (isCorrect) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.again++;
    }

    if (quizFeedback) {
      if (isCorrect) {
        quizFeedback.className = 'quiz-feedback feedback-correct';
        quizFeedback.innerHTML = `<strong>Chính xác!</strong> ${card.example ? `<br><small class="text-muted">"${card.example}" - ${card.exampleTrans || ''}</small>` : ''}`;
      } else {
        quizFeedback.className = 'quiz-feedback feedback-wrong';
        quizFeedback.innerHTML = `<strong>Chưa đúng!</strong> Nghĩa đúng là: <em>${escapeHtml(correctAnswer)}</em>`;
      }
    }

    // Tự động chuyển câu sau 1.5 giây
    setTimeout(() => {
      this.nextCard();
    }, 1500);
  }

  /* ========================================================
   * 4. CHẾ ĐỘ ĐIỀN TỪ (TYPING / FILL-IN-THE-BLANK)
   * ======================================================== */

  renderTyping(card) {
    this.typingSubmitted = false;

    const meaningEl = document.getElementById('typing-prompt-meaning');
    const hintEl = document.getElementById('typing-prompt-hint');
    const inputEl = document.getElementById('typing-input');
    const feedbackEl = document.getElementById('typing-feedback');
    const nextBtn = document.getElementById('typing-next-btn');

    if (meaningEl) meaningEl.textContent = card.meaning;
    if (inputEl) {
      inputEl.value = '';
      inputEl.disabled = false;
      inputEl.className = 'form-input typing-input-box';
      setTimeout(() => inputEl.focus(), 50);
    }

    if (hintEl) {
      if (card.lang === 'zh') {
        hintEl.innerHTML = `Chữ Hán: <strong class="font-cjk">${card.hanzi}</strong> (Nhập Pinyin hoặc Pinyin có dấu thanh)`;
      } else {
        hintEl.textContent = `Từ loại: ${card.pos || 'từ vựng'} • Gợi ý chữ cái đầu: "${card.word ? card.word[0].toUpperCase() : ''}..."`;
      }
    }

    if (feedbackEl) {
      feedbackEl.innerHTML = '';
      feedbackEl.className = 'typing-feedback';
    }

    if (nextBtn) {
      nextBtn.style.display = 'none';
    }

    const speakBtn = document.getElementById('btn-typing-speak');
    if (speakBtn) {
      speakBtn.onclick = () => {
        speakText(card.lang === 'zh' ? card.hanzi : card.word, card.lang);
      };
    }
  }

  handleTypingSubmit() {
    if (this.typingSubmitted) return;
    this.typingSubmitted = true;

    const inputEl = document.getElementById('typing-input');
    const feedbackEl = document.getElementById('typing-feedback');
    const nextBtn = document.getElementById('typing-next-btn');
    const currentCard = this.queue[this.currentIndex];

    const userText = inputEl ? inputEl.value.trim().toLowerCase() : '';
    let isCorrect = false;

    if (currentCard.lang === 'zh') {
      // Đối với tiếng Trung: so sánh với pinyin (chấp nhận cả pinyin có dấu thanh hoặc pinyin bỏ dấu thanh)
      const targetPinyin = (currentCard.pinyin || '').trim().toLowerCase();
      const normalizedTarget = removePinyinTones(targetPinyin);
      const normalizedUser = removePinyinTones(userText);

      isCorrect = userText === targetPinyin || normalizedUser === normalizedTarget || userText === currentCard.hanzi;
    } else {
      // Tiếng Anh: so sánh chính xác từ (bỏ qua hoa thường)
      const targetWord = (currentCard.word || '').trim().toLowerCase();
      isCorrect = userText === targetWord;
    }

    if (inputEl) {
      inputEl.disabled = true;
      inputEl.classList.add(isCorrect ? 'input-correct' : 'input-wrong');
    }

    // Cập nhật SRS
    const rating = isCorrect ? 3 : 1;
    const updatedCard = calculateNextReview(currentCard, rating);
    const allCards = getCards(this.app.currentLang);
    const idx = allCards.findIndex(c => c.id === currentCard.id);
    if (idx !== -1) {
      allCards[idx] = updatedCard;
      saveCards(this.app.currentLang, allCards);
    }

    recordReview(isCorrect);
    this.sessionStats.completed++;
    if (isCorrect) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.again++;
    }

    const correctDisplay = currentCard.lang === 'zh'
      ? `${currentCard.hanzi} [${currentCard.pinyin}]`
      : currentCard.word;

    if (feedbackEl) {
      if (isCorrect) {
        feedbackEl.className = 'typing-feedback feedback-correct';
        feedbackEl.innerHTML = `<strong>Tuyệt vời, chính xác!</strong> Đáp án: <code>${escapeHtml(correctDisplay)}</code>`;
      } else {
        feedbackEl.className = 'typing-feedback feedback-wrong';
        feedbackEl.innerHTML = `<strong>Chưa chính xác!</strong> Đáp án đúng là: <code>${escapeHtml(correctDisplay)}</code>`;
      }
    }

    if (nextBtn) {
      nextBtn.style.display = 'inline-block';
      nextBtn.focus();
    }

    // Tự động phát âm đáp án chuẩn
    speakText(currentCard.lang === 'zh' ? currentCard.hanzi : currentCard.word, currentCard.lang);
  }

  /* ========================================================
   * MÀN HÌNH HOÀN THÀNH PHIÊN HỌC
   * ======================================================== */

  renderCompletionScreen() {
    const completionArea = document.getElementById('completion-area');
    if (!completionArea) return;

    completionArea.style.display = 'flex';

    const accuracy = this.sessionStats.completed > 0
      ? Math.round((this.sessionStats.correct / this.sessionStats.completed) * 100)
      : 0;

    const summaryEl = document.getElementById('completion-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="completion-stats-grid">
          <div class="stat-box">
            <span class="stat-number">${this.sessionStats.completed}</span>
            <span class="stat-label">Thẻ đã học</span>
          </div>
          <div class="stat-box text-success">
            <span class="stat-number">${this.sessionStats.correct}</span>
            <span class="stat-label">Nhớ tốt</span>
          </div>
          <div class="stat-box text-danger">
            <span class="stat-number">${this.sessionStats.again}</span>
            <span class="stat-label">Cần ôn lại</span>
          </div>
          <div class="stat-box text-primary">
            <span class="stat-number">${accuracy}%</span>
            <span class="stat-label">Độ chính xác</span>
          </div>
        </div>
      `;
    }

    const restartBtn = document.getElementById('btn-restart-session');
    if (restartBtn) {
      restartBtn.onclick = () => {
        this.startSession(this.currentMode);
      };
    }

    const backHomeBtn = document.getElementById('btn-back-home');
    if (backHomeBtn) {
      backHomeBtn.onclick = () => {
        this.app.switchView('study');
        this.startSession('review');
      };
    }
  }
}

/**
 * Hàm loại bỏ dấu thanh Pinyin để so sánh gần đúng
 */
function removePinyinTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/\s+/g, '');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
