/**
 * Kịch bản kiểm thử tự động (Verification Test Suite)
 * Kiểm tra các luồng chính:
 * 1. Dữ liệu mẫu (30 thẻ EN, 30 thẻ ZH)
 * 2. Thuật toán SM-2 SRS (Quên, Khó, Được, Dễ)
 * 3. Parser & Exporter CSV/JSON (đặc biệt bảng mã UTF-8 tiếng Việt và chữ Hán CJK)
 * 4. Quản lý lưu trữ localStorage và Streak
 */

// Mock localStorage nếu chạy trong môi trường Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

// Mock window / document tối thiểu nếu cần
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => [],
      cancel: () => {},
      speak: () => {}
    }
  };
}

import { INITIAL_ENGLISH_CARDS, INITIAL_CHINESE_CARDS } from './js/data.js';
import { calculateNextReview, isCardDue, formatDate } from './js/srs.js';
import { parseCSV, initStorage, getCards, addCard, deleteCard, updateCard, recordReview, getStats } from './js/storage.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('====================================================');
console.log('BẮT ĐẦU KIỂM THỬ ỨNG DỤNG WEBFLASHCARD');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST SUITE 1: DỮ LIỆU MẪU BAN ĐẦU
// ----------------------------------------------------
console.log('TEST SUITE 1: Kiểm tra bộ dữ liệu mẫu');
assert(INITIAL_ENGLISH_CARDS.length >= 30, `Có ít nhất 30 thẻ tiếng Anh (thực tế: ${INITIAL_ENGLISH_CARDS.length})`);
assert(INITIAL_CHINESE_CARDS.length >= 30, `Có ít nhất 30 thẻ tiếng Trung HSK 1 (thực tế: ${INITIAL_CHINESE_CARDS.length})`);

// Kiểm tra trường của thẻ tiếng Anh
const sampleEn = INITIAL_ENGLISH_CARDS[0];
assert(sampleEn.word && sampleEn.ipa && sampleEn.meaning && sampleEn.example, 'Thẻ tiếng Anh có đầy đủ word, ipa, meaning, example');

// Kiểm tra trường của thẻ tiếng Trung
const sampleZh = INITIAL_CHINESE_CARDS[0];
assert(sampleZh.hanzi && sampleZh.pinyin && sampleZh.meaning && sampleZh.example, 'Thẻ tiếng Trung có đầy đủ hanzi, pinyin, meaning, example');

// ----------------------------------------------------
// TEST SUITE 2: THUẬT TOÁN SM-2 SRS
// ----------------------------------------------------
console.log('\nTEST SUITE 2: Thuật toán SuperMemo-2 SRS');

const baseCard = {
  id: 'test_01',
  lang: 'en',
  word: 'test',
  meaning: 'kiểm tra',
  status: 'new',
  reps: 0,
  interval: 0,
  easeFactor: 2.5
};

const today = formatDate();

// 1. Đánh giá Quên (Rating 1)
const afterAgain = calculateNextReview(baseCard, 1, today);
assert(afterAgain.reps === 0, 'Rating 1 (Quên): reps được đặt về 0');
assert(afterAgain.interval === 1, 'Rating 1 (Quên): interval = 1 ngày');
assert(afterAgain.easeFactor === 2.3, `Rating 1 (Quên): easeFactor giảm từ 2.5 xuống 2.3 (thực tế: ${afterAgain.easeFactor})`);
assert(afterAgain.status === 'learning', 'Rating 1 (Quên): status chuyển thành learning');

// 2. Đánh giá Được lần 1 (Rating 3)
const afterGood1 = calculateNextReview(baseCard, 3, today);
assert(afterGood1.reps === 1, 'Rating 3 (Được): reps tăng lên 1');
assert(afterGood1.interval === 1, 'Rating 3 lần đầu: interval = 1');

// 3. Đánh giá Được lần 2
const afterGood2 = calculateNextReview(afterGood1, 3, today);
assert(afterGood2.reps === 2, 'Rating 3 lần hai: reps tăng lên 2');
assert(afterGood2.interval === 3, 'Rating 3 lần hai: interval = 3');

// 4. Đánh giá Dễ (Rating 4)
const afterEasy = calculateNextReview(afterGood2, 4, today);
assert(afterEasy.reps === 3, 'Rating 4 (Dễ): reps tăng lên 3');
assert(afterEasy.interval > afterGood2.interval, `Rating 4 (Dễ): interval tăng xa hơn (${afterEasy.interval} ngày)`);
assert(afterEasy.easeFactor > afterGood2.easeFactor, `Rating 4 (Dễ): easeFactor tăng (${afterEasy.easeFactor})`);

// 5. Kiểm tra tính đến hạn ôn (isCardDue)
assert(isCardDue({ status: 'review', nextReviewDate: today }, today) === true, 'Thẻ có nextReviewDate = hôm nay là đến hạn ôn');
assert(isCardDue({ status: 'review', nextReviewDate: '2026-12-31' }, today) === false, 'Thẻ có nextReviewDate tương lai chưa đến hạn');

// ----------------------------------------------------
// TEST SUITE 3: LOCALSTORAGE & QUẢN LÝ THẺ
// ----------------------------------------------------
console.log('\nTEST SUITE 3: Lưu trữ localStorage & CRUD');

initStorage();
const initialEnCards = getCards('en');
assert(initialEnCards.length >= 30, 'Đã nạp thành công 30 thẻ tiếng Anh vào storage');

const addedCard = addCard('en', {
  word: 'epiphany',
  ipa: '/ɪˈpɪf.ən.i/',
  pos: 'noun',
  meaning: 'Sự bừng sáng, giác ngộ',
  example: 'He had a sudden epiphany.',
  exampleTrans: 'Anh ấy bỗng nhiên có một sự giác ngộ.'
});
assert(addedCard && addedCard.id, `Thêm thẻ mới thành công với ID: ${addedCard.id}`);

const cardsAfterAdd = getCards('en');
assert(cardsAfterAdd.length === initialEnCards.length + 1, 'Số lượng thẻ tăng thêm 1 sau khi thêm');

// Sửa thẻ
const updatedSuccess = updateCard('en', { ...addedCard, meaning: 'Sự khai sáng tâm trí' });
assert(updatedSuccess === true, 'Cập nhật thẻ thành công');
const foundUpdated = getCards('en').find(c => c.id === addedCard.id);
assert(foundUpdated.meaning === 'Sự khai sáng tâm trí', 'Nội dung cập nhật được lưu chính xác');

// Xóa thẻ
const deletedSuccess = deleteCard('en', addedCard.id);
assert(deletedSuccess === true, 'Xóa thẻ thành công');
const cardsAfterDelete = getCards('en');
assert(cardsAfterDelete.length === initialEnCards.length, 'Số lượng thẻ trở về ban đầu sau khi xóa');

// Thống kê & Streak
recordReview(true);
const stats = getStats();
assert(stats.totalReviews >= 1, `Tổng số lượt ôn được ghi nhận: ${stats.totalReviews}`);
assert(stats.currentStreak >= 1, `Chuỗi streak được tính chính xác: ${stats.currentStreak} ngày`);

// ----------------------------------------------------
// TEST SUITE 4: PARSER CSV (TIẾNG VIỆT & CHỮ HÁN CJK)
// ----------------------------------------------------
console.log('\nTEST SUITE 4: Phân tích cú pháp CSV (Bảng mã & Dấu phẩy)');

// Chuỗi CSV tiếng Anh có chứa dấu phẩy trong ngoặc kép và tiếng Việt
const sampleEnCsv = `id,word,ipa,pos,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate
en_test_1,"take, break",/teɪk breɪk/,phrase,"Nghỉ ngơi, giải lao","Let's take a break, shall we?","Chúng ta hãy nghỉ ngơi một chút nhé?",new,0,2.5,0,2026-10-10
en_test_2,horizon,/həˈraɪ.zən/,noun,"Đường chân trời","The sun sank below the horizon.","Mặt trời chìm dần dưới đường chân trời.",new,0,2.5,0,2026-10-10`;

const parsedEn = parseCSV('en', sampleEnCsv);
assert(parsedEn.length === 2, `Parse CSV tiếng Anh: nhận diện đủ 2 dòng thẻ`);
assert(parsedEn[0].word === 'take, break', 'Parse CSV: giữ nguyên dấu phẩy bên trong dấu ngoặc kép');
assert(parsedEn[0].meaning === 'Nghỉ ngơi, giải lao', 'Parse CSV: bảo toàn dấu tiếng Việt');

// Chuỗi CSV tiếng Trung có chữ Hán và dấu câu CJK
const sampleZhCsv = `id,hanzi,pinyin,hskLevel,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate
zh_test_1,喝茶,hē chá,HSK 1,Uống trà,"中国人喜欢喝茶。","Người Trung Quốc thích uống trà.",new,0,2.5,0,2026-10-10
zh_test_2,电脑,diàn nǎo,HSK 1,Máy vi tính,"我买了一台新电脑。","Tôi đã mua một chiếc máy vi tính mới.",new,0,2.5,0,2026-10-10`;

const parsedZh = parseCSV('zh', sampleZhCsv);
assert(parsedZh.length === 2, `Parse CSV tiếng Trung: nhận diện đủ 2 dòng thẻ`);
assert(parsedZh[0].hanzi === '喝茶', `Parse CSV: bảo toàn ký tự chữ Hán: ${parsedZh[0].hanzi}`);
assert(parsedZh[0].pinyin === 'hē chá', `Parse CSV: bảo toàn pinyin có dấu thanh: ${parsedZh[0].pinyin}`);

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests} / ${totalTests} BÀI KIỂM TRA ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
