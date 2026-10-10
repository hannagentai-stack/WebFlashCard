/* WebFlashCard - Standalone Bundle */
(() => {

/* --- File: js/data.js --- */
/**
 * Dữ liệu mẫu ban đầu cho ứng dụng Flashcard song ngữ (Tiếng Anh & Tiếng Trung)
 * Bao gồm 30 thẻ tiếng Anh thông dụng và 30 thẻ tiếng Trung HSK 1
 */

// Hàm tiện ích lấy ngày hôm nay theo định dạng YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getTodayString();

const INITIAL_ENGLISH_CARDS = [
  {
    id: "en_001",
    lang: "en",
    word: "serendipity",
    ipa: "/ˌser.ənˈdɪp.ə.ti/",
    pos: "noun",
    meaning: "Sự tình cờ may mắn",
    example: "Finding this rare book was pure serendipity.",
    exampleTrans: "Tìm được cuốn sách quý này quả là một sự tình cờ may mắn.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_002",
    lang: "en",
    word: "resilience",
    ipa: "/rɪˈzɪl.jəns/",
    pos: "noun",
    meaning: "Khả năng kiên cường, phục hồi nhanh",
    example: "She showed great resilience after the failure.",
    exampleTrans: "Cô ấy đã thể hiện sự kiên cường tuyệt vời sau thất bại.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_003",
    lang: "en",
    word: "meticulous",
    ipa: "/məˈtɪk.jə.ləs/",
    pos: "adjective",
    meaning: "Tỉ mỉ, cẩn thận từng chi tiết",
    example: "He is meticulous about his code quality.",
    exampleTrans: "Anh ấy rất tỉ mỉ về chất lượng mã nguồn của mình.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_004",
    lang: "en",
    word: "ephemeral",
    ipa: "/ɪˈfem.ər.əl/",
    pos: "adjective",
    meaning: "Phù du, chóng tàn, ngắn ngủi",
    example: "Fame can be ephemeral in the digital age.",
    exampleTrans: "Sự nổi tiếng có thể rất ngắn ngủi trong thời đại số.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_005",
    lang: "en",
    word: "ubiquitous",
    ipa: "/juːˈbɪk.wə.təs/",
    pos: "adjective",
    meaning: "Phổ biến, ở đâu cũng có",
    example: "Smartphones have become ubiquitous nowadays.",
    exampleTrans: "Điện thoại thông minh ngày nay đã trở nên phổ biến khắp nơi.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_006",
    lang: "en",
    word: "eloquent",
    ipa: "/ˈel.ə.kwənt/",
    pos: "adjective",
    meaning: "Hùng biện, lưu loát, truyền cảm",
    example: "He gave an eloquent speech to the audience.",
    exampleTrans: "Ông đã có một bài phát biểu hùng hồn trước cử tọa.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_007",
    lang: "en",
    word: "pragmatic",
    ipa: "/præɡˈmæt.ɪk/",
    pos: "adjective",
    meaning: "Thực tế, thực dụng",
    example: "We need a pragmatic approach to solve this issue.",
    exampleTrans: "Chúng ta cần một cách tiếp cận thực tế để giải quyết vấn đề này.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_008",
    lang: "en",
    word: "empathy",
    ipa: "/ˈem.pə.θi/",
    pos: "noun",
    meaning: "Sự thấu cảm, đồng cảm sâu sắc",
    example: "Empathy is essential in healthy relationships.",
    exampleTrans: "Sự thấu cảm là điều cốt yếu trong các mối quan hệ lành mạnh.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_009",
    lang: "en",
    word: "collaborate",
    ipa: "/kəˈlæb.ə.reɪt/",
    pos: "verb",
    meaning: "Hợp tác, cộng tác",
    example: "Teams must collaborate closely to finish on time.",
    exampleTrans: "Các nhóm phải cộng tác chặt chẽ để hoàn thành đúng hạn.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_010",
    lang: "en",
    word: "innovative",
    ipa: "/ˈɪn.ə.və.tɪv/",
    pos: "adjective",
    meaning: "Mang tính đổi mới, sáng tạo",
    example: "The startup introduced an innovative solution.",
    exampleTrans: "Công ty khởi nghiệp đã giới thiệu một giải pháp mang tính đổi mới.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_011",
    lang: "en",
    word: "ambiguous",
    ipa: "/æmˈbɪɡ.ju.əs/",
    pos: "adjective",
    meaning: "Mơ hồ, nước đôi, khó hiểu",
    example: "Her reply was ambiguous and left us puzzled.",
    exampleTrans: "Câu trả lời của cô ấy mơ hồ khiến chúng tôi bối rối.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_012",
    lang: "en",
    word: "diligent",
    ipa: "/ˈdɪl.ə.dʒənt/",
    pos: "adjective",
    meaning: "Chăm chỉ, siêng năng, cần cù",
    example: "He is a diligent student who studies every day.",
    exampleTrans: "Cậu ấy là một học sinh chăm chỉ học bài mỗi ngày.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_013",
    lang: "en",
    word: "lucid",
    ipa: "/ˈluː.sɪd/",
    pos: "adjective",
    meaning: "Rõ ràng, minh bạch, dễ hiểu",
    example: "She provided a lucid explanation of the concept.",
    exampleTrans: "Cô ấy đã đưa ra một lời giải thích rất rõ ràng về khái niệm đó.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_014",
    lang: "en",
    word: "benevolent",
    ipa: "/bəˈnev.əl.ənt/",
    pos: "adjective",
    meaning: "Nhân từ, rộng lượng, tốt bụng",
    example: "The benevolent donor funded the library.",
    exampleTrans: "Nhà hảo tâm nhân từ đã tài trợ xây dựng thư viện.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_015",
    lang: "en",
    word: "tenacious",
    ipa: "/təˈneɪ.ʃəs/",
    pos: "adjective",
    meaning: "Kiên trì, dai dẳng, ngoan cường",
    example: "Her tenacious effort finally paid off.",
    exampleTrans: "Nỗ lực kiên cường của cô ấy cuối cùng cũng được đền đáp.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_016",
    lang: "en",
    word: "superficial",
    ipa: "/ˌsuː.pɚˈfɪʃ.əl/",
    pos: "adjective",
    meaning: "Nông cạn, hời hợt, bề ngoài",
    example: "Do not make superficial judgments.",
    exampleTrans: "Đừng đưa ra những phán xét hời hợt bên ngoài.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_017",
    lang: "en",
    word: "versatile",
    ipa: "/ˈvɝː.sə.t̬əl/",
    pos: "adjective",
    meaning: "Linh hoạt, đa năng, nhiều tài",
    example: "Python is a versatile programming language.",
    exampleTrans: "Python là một ngôn ngữ lập trình rất đa năng.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_018",
    lang: "en",
    word: "profound",
    ipa: "/prəˈfaʊnd/",
    pos: "adjective",
    meaning: "Sâu sắc, uyên thâm",
    example: "The book had a profound impact on my thinking.",
    exampleTrans: "Cuốn sách đã có tác động sâu sắc đến tư duy của tôi.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_019",
    lang: "en",
    word: "alleviate",
    ipa: "/əˈliː.vi.eɪt/",
    pos: "verb",
    meaning: "Làm nhẹ bớt, làm giảm bớt (đau đớn, khó khăn)",
    example: "Medicine helped alleviate the symptoms.",
    exampleTrans: "Thuốc đã giúp làm giảm bớt các triệu chứng.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_020",
    lang: "en",
    word: "candid",
    ipa: "/ˈkæn.dɪd/",
    pos: "adjective",
    meaning: "Thẳng thắn, thật thà, chân thành",
    example: "I appreciate your candid feedback.",
    exampleTrans: "Tôi rất trân trọng phản hồi thẳng thắn của bạn.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_021",
    lang: "en",
    word: "augment",
    ipa: "/ɔːɡˈment/",
    pos: "verb",
    meaning: "Gia tăng, tăng cường, bổ sung",
    example: "He plans to augment his income with freelance work.",
    exampleTrans: "Anh ấy dự định gia tăng thu nhập bằng việc làm tự do.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_022",
    lang: "en",
    word: "coherent",
    ipa: "/koʊˈhɪr.ənt/",
    pos: "adjective",
    meaning: "Mạch lạc, chặt chẽ, gắn kết",
    example: "The essay presents a coherent argument.",
    exampleTrans: "Bài tiểu luận trình bày một lập luận rất mạch lạc.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_023",
    lang: "en",
    word: "deteriorate",
    ipa: "/dɪˈtɪr.i.ə.reɪt/",
    pos: "verb",
    meaning: "Xuống cấp, xấu đi, giảm giá trị",
    example: "The weather began to deteriorate rapidly.",
    exampleTrans: "Thời tiết bắt đầu xấu đi một cách nhanh chóng.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_024",
    lang: "en",
    word: "exemplary",
    ipa: "/ɪɡˈzem.plɚ.i/",
    pos: "adjective",
    meaning: "Gương mẫu, mẫu mực",
    example: "Her behavior was exemplary throughout the event.",
    exampleTrans: "Hành vi của cô ấy rất mẫu mực trong suốt sự kiện.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_025",
    lang: "en",
    word: "friction",
    ipa: "/ˈfrɪk.ʃən/",
    pos: "noun",
    meaning: "Sự ma sát; sự bất đồng, xung đột",
    example: "Good communication reduces friction in teams.",
    exampleTrans: "Giao tiếp tốt giúp giảm bớt xung đột trong đội ngũ.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_026",
    lang: "en",
    word: "gratitude",
    ipa: "/ˈɡræt̬.ə.tuːd/",
    pos: "noun",
    meaning: "Lòng biết ơn",
    example: "Expressing gratitude improves mental well-being.",
    exampleTrans: "Bày tỏ lòng biết ơn giúp cải thiện sức khỏe tinh thần.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_027",
    lang: "en",
    word: "harmonious",
    ipa: "/hɑːrˈmoʊ.ni.əs/",
    pos: "adjective",
    meaning: "Hài hòa, hòa thuận, ăn ý",
    example: "They created a harmonious working atmosphere.",
    exampleTrans: "Họ đã tạo ra một bầu không khí làm việc hòa thuận.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_028",
    lang: "en",
    word: "inevitable",
    ipa: "/ˌɪnˈev.ə.t̬ə.bəl/",
    pos: "adjective",
    meaning: "Không thể tránh khỏi, tất yếu",
    example: "Change is an inevitable part of life.",
    exampleTrans: "Sự thay đổi là một phần tất yếu của cuộc sống.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_029",
    lang: "en",
    word: "judicious",
    ipa: "/dʒuːˈdɪʃ.əs/",
    pos: "adjective",
    meaning: "Sáng suốt, khôn ngoan, thận trọng",
    example: "We made judicious use of our limited budget.",
    exampleTrans: "Chúng tôi đã sử dụng ngân sách hạn hẹp một cách khôn ngoan.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "en_030",
    lang: "en",
    word: "keen",
    ipa: "/kiːn/",
    pos: "adjective",
    meaning: "Sắc bén, nhiệt tình, ham thích",
    example: "He has a keen eye for great design.",
    exampleTrans: "Anh ấy có con mắt sắc sảo đối với thiết kế đẹp.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  }
];

const INITIAL_CHINESE_CARDS = [
  {
    id: "zh_001",
    lang: "zh",
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    hskLevel: "HSK 1",
    meaning: "Xin chào",
    example: "你好，很高兴认识你！",
    exampleTrans: "Xin chào, rất vui được quen biết bạn!",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_002",
    lang: "zh",
    hanzi: "谢谢",
    pinyin: "xiè xie",
    hskLevel: "HSK 1",
    meaning: "Cảm ơn",
    example: "谢谢你的帮助。",
    exampleTrans: "Cảm ơn sự giúp đỡ của bạn.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_003",
    lang: "zh",
    hanzi: "不客气",
    pinyin: "bù kè qi",
    hskLevel: "HSK 1",
    meaning: "Đừng khách sáo, không có chi",
    example: "不用谢，不客气！",
    exampleTrans: "Không cần cảm ơn, đừng khách sáo!",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_004",
    lang: "zh",
    hanzi: "再见",
    pinyin: "zài jiàn",
    hskLevel: "HSK 1",
    meaning: "Tạm biệt",
    example: "明天见，再见！",
    exampleTrans: "Ngày mai gặp nhé, tạm biệt!",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_005",
    lang: "zh",
    hanzi: "中国",
    pinyin: "zhōng guó",
    hskLevel: "HSK 1",
    meaning: "Trung Quốc",
    example: "我想去中国旅游。",
    exampleTrans: "Tôi muốn đi du lịch Trung Quốc.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_006",
    lang: "zh",
    hanzi: "朋友",
    pinyin: "péng you",
    hskLevel: "HSK 1",
    meaning: "Bạn bè, bạn",
    example: "他是我的好朋友。",
    exampleTrans: "Anh ấy là bạn thân của tôi.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_007",
    lang: "zh",
    hanzi: "老师",
    pinyin: "lǎo shī",
    hskLevel: "HSK 1",
    meaning: "Thầy cô giáo",
    example: "王老师教我们汉语。",
    exampleTrans: "Thầy Vương dạy chúng tôi tiếng Trung.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_008",
    lang: "zh",
    hanzi: "学生",
    pinyin: "xué sheng",
    hskLevel: "HSK 1",
    meaning: "Học sinh, sinh viên",
    example: "这所学校有很多学生。",
    exampleTrans: "Trường này có rất nhiều học sinh.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_009",
    lang: "zh",
    hanzi: "学习",
    pinyin: "xué xí",
    hskLevel: "HSK 1",
    meaning: "Học tập, học",
    example: "我喜欢学习中文。",
    exampleTrans: "Tôi thích học tiếng Trung.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_010",
    lang: "zh",
    hanzi: "喝水",
    pinyin: "hē shuǐ",
    hskLevel: "HSK 1",
    meaning: "Uống nước",
    example: "天气热，多喝水。",
    exampleTrans: "Trời nóng, hãy uống nhiều nước.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_011",
    lang: "zh",
    hanzi: "吃饭",
    pinyin: "chī fàn",
    hskLevel: "HSK 1",
    meaning: "Ăn cơm, ăn bữa",
    example: "你吃饭了吗？",
    exampleTrans: "Bạn đã ăn cơm chưa?",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_012",
    lang: "zh",
    hanzi: "苹果",
    pinyin: "píng guǒ",
    hskLevel: "HSK 1",
    meaning: "Quả táo",
    example: "我想买三个苹果。",
    exampleTrans: "Tôi muốn mua ba quả táo.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_013",
    lang: "zh",
    hanzi: "喜欢",
    pinyin: "xǐ huan",
    hskLevel: "HSK 1",
    meaning: "Thích",
    example: "我很喜欢这只小猫。",
    exampleTrans: "Tôi rất thích chú mèo con này.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_014",
    lang: "zh",
    hanzi: "看见",
    pinyin: "kàn jiàn",
    hskLevel: "HSK 1",
    meaning: "Nhìn thấy, trông thấy",
    example: "你看见我的手机了吗？",
    exampleTrans: "Bạn có nhìn thấy điện thoại của tôi không?",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_015",
    lang: "zh",
    hanzi: "听音乐",
    pinyin: "tīng yīn yuè",
    hskLevel: "HSK 1",
    meaning: "Nghe nhạc",
    example: "我经常在晚上听音乐。",
    exampleTrans: "Tôi thường nghe nhạc vào buổi tối.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_016",
    lang: "zh",
    hanzi: "高兴",
    pinyin: "gāo xìng",
    hskLevel: "HSK 1",
    meaning: "Vui vẻ, phấn khởi",
    example: "今天大家都很高兴。",
    exampleTrans: "Hôm nay mọi người đều rất vui.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_017",
    lang: "zh",
    hanzi: "天气",
    pinyin: "tiān qì",
    hskLevel: "HSK 1",
    meaning: "Thời tiết",
    example: "今天天气非常好。",
    exampleTrans: "Hôm nay thời tiết rất đẹp.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_018",
    lang: "zh",
    hanzi: "衣服",
    pinyin: "yī fu",
    hskLevel: "HSK 1",
    meaning: "Quần áo, y phục",
    example: "这件衣服很漂亮。",
    exampleTrans: "Bộ quần áo này rất đẹp.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_019",
    lang: "zh",
    hanzi: "医院",
    pinyin: "yī yuàn",
    hskLevel: "HSK 1",
    meaning: "Bệnh viện",
    example: "医生在医院工作。",
    exampleTrans: "Bác sĩ làm việc ở bệnh viện.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_020",
    lang: "zh",
    hanzi: "火车站",
    pinyin: "huǒ chē zhàn",
    hskLevel: "HSK 1",
    meaning: "Ga xe lửa, ga tàu",
    example: "我们去火车站接人。",
    exampleTrans: "Chúng tôi đi ga tàu đón người.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_021",
    lang: "zh",
    hanzi: "现在",
    pinyin: "xiàn zài",
    hskLevel: "HSK 1",
    meaning: "Bây giờ, hiện tại",
    example: "现在是早上八点。",
    exampleTrans: "Bây giờ là 8 giờ sáng.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_022",
    lang: "zh",
    hanzi: "明天",
    pinyin: "míng tiān",
    hskLevel: "HSK 1",
    meaning: "Ngày mai",
    example: "明天星期六，我不去学校。",
    exampleTrans: "Ngày mai là thứ Bảy, tôi không đến trường.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_023",
    lang: "zh",
    hanzi: "上午",
    pinyin: "shàng wǔ",
    hskLevel: "HSK 1",
    meaning: "Buổi sáng",
    example: "我上午有两节课。",
    exampleTrans: "Buổi sáng tôi có hai tiết học.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_024",
    lang: "zh",
    hanzi: "多少",
    pinyin: "duō shao",
    hskLevel: "HSK 1",
    meaning: "Bao nhiêu",
    example: "这个多少钱？",
    exampleTrans: "Cái này giá bao nhiêu tiền?",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_025",
    lang: "zh",
    hanzi: "怎么样",
    pinyin: "zěn me yàng",
    hskLevel: "HSK 1",
    meaning: "Như thế nào, ra sao",
    example: "你觉得这部电影怎么样？",
    exampleTrans: "Bạn thấy bộ phim này thế nào?",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_026",
    lang: "zh",
    hanzi: "读书",
    pinyin: "dú shū",
    hskLevel: "HSK 1",
    meaning: "Đọc sách, đi học",
    example: "他在图书馆读书。",
    exampleTrans: "Anh ấy đang đọc sách ở thư viện.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_027",
    lang: "zh",
    hanzi: "写字",
    pinyin: "xiě zì",
    hskLevel: "HSK 1",
    meaning: "Viết chữ",
    example: "汉字很好看，我想学写字。",
    exampleTrans: "Chữ Hán rất đẹp, tôi muốn học viết chữ.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_028",
    lang: "zh",
    hanzi: "名字",
    pinyin: "míng zi",
    hskLevel: "HSK 1",
    meaning: "Tên, danh tính",
    example: "请问你叫什么名字？",
    exampleTrans: "Xin hỏi bạn tên là gì?",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_029",
    lang: "zh",
    hanzi: "家里",
    pinyin: "jiā lǐ",
    hskLevel: "HSK 1",
    meaning: "Trong nhà, ở nhà",
    example: "家里有爸爸、妈妈和我。",
    exampleTrans: "Trong nhà có bố, mẹ và tôi.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  },
  {
    id: "zh_030",
    lang: "zh",
    hanzi: "工作",
    pinyin: "gōng zuò",
    hskLevel: "HSK 1",
    meaning: "Công việc, làm việc",
    example: "我很喜欢现在的工作。",
    exampleTrans: "Tôi rất thích công việc hiện tại.",
    status: "new",
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: todayStr,
    lastReviewDate: null
  }
];


/* --- File: js/srs.js --- */
/**
 * Thuật toán lặp lại ngắt quãng SM-2 (SuperMemo-2 SRS)
 * Quản lý khoảng cách ngày ôn tập, hệ số độ dễ (Ease Factor) và trạng thái thẻ
 */

/**
 * Lấy chuỗi ngày định dạng YYYY-MM-DD
 * @param {Date} [date]
 * @returns {string}
 */
function formatDate(date = new Date()) {
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
function addDays(date, days) {
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
function calculateNextReview(card, rating, currentDateStr = formatDate()) {
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
function isCardDue(card, todayStr = formatDate()) {
  if (card.status === "new") return false;
  if (!card.nextReviewDate) return true;
  return card.nextReviewDate <= todayStr;
}

/**
 * Lấy nhãn mô tả thời gian ôn tiếp theo dạng tiếng Việt
 * @param {number} interval
 * @returns {string}
 */
function getIntervalBadgeText(interval) {
  if (interval <= 0) return "Hôm nay";
  if (interval === 1) return "1 ngày nữa";
  if (interval < 30) return `${interval} ngày nữa`;
  const months = Math.round(interval / 30);
  return `${months} tháng nữa`;
}


/* --- File: js/storage.js --- */
/**
 * Quản lý lưu trữ localStorage, nhập/xuất CSV và JSON, theo dõi chuỗi ngày Streak
 */




const STORAGE_KEYS = {
  EN_CARDS: 'webflashcard_cards_en',
  ZH_CARDS: 'webflashcard_cards_zh',
  STATS: 'webflashcard_stats',
  THEME: 'webflashcard_theme'
};

/**
 * Khởi tạo dữ liệu ban đầu nếu localStorage chưa có
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.EN_CARDS)) {
    localStorage.setItem(STORAGE_KEYS.EN_CARDS, JSON.stringify(INITIAL_ENGLISH_CARDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ZH_CARDS)) {
    localStorage.setItem(STORAGE_KEYS.ZH_CARDS, JSON.stringify(INITIAL_CHINESE_CARDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
    const defaultStats = {
      currentStreak: 0,
      lastActiveDate: null,
      totalReviews: 0,
      correctReviews: 0
    };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
  }
}

/**
 * Lấy danh sách thẻ theo ngôn ngữ ('en' hoặc 'zh')
 * @param {'en'|'zh'} lang
 * @returns {Array<Object>}
 */
function getCards(lang) {
  const key = lang === 'zh' ? STORAGE_KEYS.ZH_CARDS : STORAGE_KEYS.EN_CARDS;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const fallback = lang === 'zh' ? INITIAL_CHINESE_CARDS : INITIAL_ENGLISH_CARDS;
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Lỗi khi đọc thẻ cho ngôn ngữ ${lang}:`, err);
    return lang === 'zh' ? INITIAL_CHINESE_CARDS : INITIAL_ENGLISH_CARDS;
  }
}

/**
 * Lưu danh sách thẻ vào localStorage
 * @param {'en'|'zh'} lang
 * @param {Array<Object>} cards
 */
function saveCards(lang, cards) {
  const key = lang === 'zh' ? STORAGE_KEYS.ZH_CARDS : STORAGE_KEYS.EN_CARDS;
  localStorage.setItem(key, JSON.stringify(cards));
}

/**
 * Thêm một thẻ mới vào bộ thẻ
 * @param {'en'|'zh'} lang
 * @param {Object} cardData
 * @returns {Object} Thẻ mới được tạo
 */
function addCard(lang, cardData) {
  const cards = getCards(lang);
  const now = new Date();
  const idPrefix = lang === 'zh' ? 'zh_' : 'en_';
  const newId = `${idPrefix}${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newCard = {
    id: newId,
    lang,
    status: 'new',
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: formatDate(now),
    lastReviewDate: null,
    createdAt: Date.now(),
    ...cardData
  };

  cards.unshift(newCard); // Thêm vào đầu danh sách
  saveCards(lang, cards);
  return newCard;
}

/**
 * Cập nhật thông tin của một thẻ
 * @param {'en'|'zh'} lang
 * @param {Object} updatedCard
 * @returns {boolean}
 */
function updateCard(lang, updatedCard) {
  const cards = getCards(lang);
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index === -1) return false;

  cards[index] = { ...cards[index], ...updatedCard };
  saveCards(lang, cards);
  return true;
}

/**
 * Xóa một thẻ khỏi bộ thẻ
 * @param {'en'|'zh'} lang
 * @param {string} cardId
 * @returns {boolean}
 */
function deleteCard(lang, cardId) {
  const cards = getCards(lang);
  const filtered = cards.filter(c => c.id !== cardId);
  if (filtered.length === cards.length) return false;

  saveCards(lang, filtered);
  return true;
}

/**
 * Khôi phục dữ liệu về mặc định ban đầu
 * @param {'en'|'zh'|'all'} target
 */
function resetToDefault(target = 'all') {
  if (target === 'en' || target === 'all') {
    localStorage.setItem(STORAGE_KEYS.EN_CARDS, JSON.stringify(INITIAL_ENGLISH_CARDS));
  }
  if (target === 'zh' || target === 'all') {
    localStorage.setItem(STORAGE_KEYS.ZH_CARDS, JSON.stringify(INITIAL_CHINESE_CARDS));
  }
}

/**
 * Lấy thông tin thống kê học tập
 * @returns {Object}
 */
function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return { currentStreak: 0, lastActiveDate: null, totalReviews: 0, correctReviews: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { currentStreak: 0, lastActiveDate: null, totalReviews: 0, correctReviews: 0 };
  }
}

/**
 * Ghi nhận một lượt học thẻ và cập nhật chuỗi ngày Streak
 * @param {boolean} isPositiveReview Đánh giá đạt (rating >= 2)
 */
function recordReview(isPositiveReview = true) {
  const stats = getStats();
  const todayStr = formatDate();

  stats.totalReviews = (stats.totalReviews || 0) + 1;
  if (isPositiveReview) {
    stats.correctReviews = (stats.correctReviews || 0) + 1;
  }

  // Xử lý chuỗi ngày học Streak
  if (!stats.lastActiveDate) {
    stats.currentStreak = 1;
  } else if (stats.lastActiveDate !== todayStr) {
    const lastDate = new Date(stats.lastActiveDate);
    const today = new Date(todayStr);
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Học liên tục ngày hôm sau
      stats.currentStreak = (stats.currentStreak || 0) + 1;
    } else if (diffDays > 1) {
      // Bị đứt chuỗi, bắt đầu lại
      stats.currentStreak = 1;
    }
  }

  stats.lastActiveDate = todayStr;
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  return stats;
}

/**
 * Lấy và lưu giao diện Theme (sáng / tối)
 */
function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

function saveStoredTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/* ========================================================
 * XUẤT VÀ NHẬP DỮ LIỆU (JSON & CSV)
 * ======================================================== */

/**
 * Xuất dữ liệu ra file JSON và kích hoạt tải xuống
 * @param {'en'|'zh'} lang
 */
function exportCardsJSON(lang) {
  const cards = getCards(lang);
  const jsonStr = JSON.stringify(cards, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `webflashcard_${lang}_${formatDate()}.json`);
}

/**
 * Xuất dữ liệu ra file CSV kèm UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt & chữ Hán
 * @param {'en'|'zh'} lang
 */
function exportCardsCSV(lang) {
  const cards = getCards(lang);
  let csvContent = '\uFEFF'; // UTF-8 BOM

  if (lang === 'zh') {
    csvContent += 'id,hanzi,pinyin,hskLevel,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate\n';
    cards.forEach(c => {
      const row = [
        escapeCsvField(c.id || ''),
        escapeCsvField(c.hanzi || ''),
        escapeCsvField(c.pinyin || ''),
        escapeCsvField(c.hskLevel || ''),
        escapeCsvField(c.meaning || ''),
        escapeCsvField(c.example || ''),
        escapeCsvField(c.exampleTrans || ''),
        escapeCsvField(c.status || 'new'),
        c.interval ?? 0,
        c.easeFactor ?? 2.5,
        c.reps ?? 0,
        escapeCsvField(c.nextReviewDate || formatDate())
      ];
      csvContent += row.join(',') + '\n';
    });
  } else {
    csvContent += 'id,word,ipa,pos,meaning,example,exampleTrans,status,interval,easeFactor,reps,nextReviewDate\n';
    cards.forEach(c => {
      const row = [
        escapeCsvField(c.id || ''),
        escapeCsvField(c.word || ''),
        escapeCsvField(c.ipa || ''),
        escapeCsvField(c.pos || ''),
        escapeCsvField(c.meaning || ''),
        escapeCsvField(c.example || ''),
        escapeCsvField(c.exampleTrans || ''),
        escapeCsvField(c.status || 'new'),
        c.interval ?? 0,
        c.easeFactor ?? 2.5,
        c.reps ?? 0,
        escapeCsvField(c.nextReviewDate || formatDate())
      ];
      csvContent += row.join(',') + '\n';
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `webflashcard_${lang}_${formatDate()}.csv`);
}

/**
 * Thoát ký tự đặc biệt cho trường CSV
 * @param {string|number} field
 * @returns {string}
 */
function escapeCsvField(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tải file từ Blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Phân tích cú pháp chuỗi CSV thành mảng thẻ
 * @param {'en'|'zh'} lang
 * @param {string} csvText
 * @returns {Array<Object>}
 */
function parseCSV(lang, csvText) {
  // Loại bỏ BOM nếu có
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = parseCSVRows(cleanText);
  if (lines.length < 2) {
    throw new Error('File CSV không có dữ liệu hợp lệ (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
  }

  const header = lines[0].map(h => h.trim().toLowerCase());
  const parsedCards = [];
  const todayStr = formatDate();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;

    const rowObj = {};
    header.forEach((colName, idx) => {
      rowObj[colName] = row[idx] ? row[idx].trim() : '';
    });

    const id = rowObj.id || `${lang}_${Date.now()}_${i}`;

    if (lang === 'zh') {
      const hanzi = rowObj.hanzi || rowObj['chữ hán'] || rowObj['từ'] || '';
      const meaning = rowObj.meaning || rowObj['nghĩa'] || '';
      if (!hanzi || !meaning) continue; // Bỏ qua dòng thiếu dữ liệu chính

      parsedCards.push({
        id,
        lang: 'zh',
        hanzi,
        pinyin: rowObj.pinyin || '',
        hskLevel: rowObj.hsklevel || rowObj['hsk'] || 'HSK 1',
        meaning,
        example: rowObj.example || rowObj['ví dụ'] || '',
        exampleTrans: rowObj.exampletrans || rowObj['dịch ví dụ'] || '',
        status: rowObj.status || 'new',
        interval: Number(rowObj.interval) || 0,
        easeFactor: Number(rowObj.easefactor) || 2.5,
        reps: Number(rowObj.reps) || 0,
        nextReviewDate: rowObj.nextreviewdate || todayStr,
        lastReviewDate: null
      });
    } else {
      const word = rowObj.word || rowObj['từ'] || '';
      const meaning = rowObj.meaning || rowObj['nghĩa'] || '';
      if (!word || !meaning) continue;

      parsedCards.push({
        id,
        lang: 'en',
        word,
        ipa: rowObj.ipa || rowObj['phiên âm'] || '',
        pos: rowObj.pos || rowObj['loại từ'] || '',
        meaning,
        example: rowObj.example || rowObj['ví dụ'] || '',
        exampleTrans: rowObj.exampletrans || rowObj['dịch ví dụ'] || '',
        status: rowObj.status || 'new',
        interval: Number(rowObj.interval) || 0,
        easeFactor: Number(rowObj.easefactor) || 2.5,
        reps: Number(rowObj.reps) || 0,
        nextReviewDate: rowObj.nextreviewdate || todayStr,
        lastReviewDate: null
      });
    }
  }

  return parsedCards;
}

/**
 * Xử lý ngắt dòng và dấu ngoặc kép chuẩn CSV
 */
function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Bỏ qua nháy kép escape
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}


/* --- File: js/speech.js --- */
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
function speakText(text, lang = 'en', rate = 0.9) {
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
function showToast(message, type = 'info', duration = 3000) {
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


/* --- File: js/study.js --- */
/**
 * Quản lý các chế độ học tập:
 * 1. Học mới (New Cards)
 * 2. Ôn tập (Due Review Cards)
 * 3. Trắc nghiệm (4-choice Quiz)
 * 4. Điền từ (Typing / Fill-in-the-blank)
 */





class StudyController {
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


/* --- File: js/deck-manager.js --- */
/**
 * Quản lý danh sách thẻ (Deck Manager)
 * Các tính năng: Hiển thị bảng thẻ, Tìm kiếm, Lọc, Thêm mới, Sửa, Xóa, Nhập/Xuất CSV và JSON
 */





class DeckManager {
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


/* --- File: js/app.js --- */
/**
 * WebFlashCard - Ứng Dụng Học Từ Vựng Song Ngữ Thông Minh (Client Controller)
 * Quản lý xác thực, chuyển đổi giao diện, bộ thẻ, tải file, xem trước thẻ,
 * 4 chế độ học tập (Flashcard, Quiz, Typing), Focus Mode và biểu đồ thống kê 7 ngày.
 */



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


})();
