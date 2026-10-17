const LANG_KEY = 'labex.language';

export function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

export function setLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang === 'en' ? 'en' : 'vi');
  } catch {
    /* Optional */
  }
  window.dispatchEvent(new CustomEvent('labex-lang-change', { detail: lang }));
}

export const translations = {
  vi: {
    learn: 'Khóa học',
    roadmaps: 'Lộ trình',
    search: 'Tìm kiếm...',
    searchPlaceholder: 'Tìm kiếm khóa học hoặc chủ đề...',
    checkingEnv: 'Đang kiểm tra môi trường...',
    envReady: 'Sẵn sàng',
    envNotReady: 'Chưa sẵn sàng',
    retry: 'Thử lại',
    lightMode: 'Dùng giao diện sáng',
    darkMode: 'Dùng giao diện tối',
    courseDetail: 'Chi tiết khóa học',
    back: 'Quay lại',
    continue: 'Tiếp tục',
    verify: 'Kiểm tra kết quả',
    reverify: 'Kiểm tra lại',
    verifying: 'Đang kiểm tra...',
    copy: 'Copy',
    copied: 'Đã chép',
    completed: 'hoàn thành',
    sectionNumber: 'Mục',
    task: 'Nhiệm vụ',
    intro: 'Giới thiệu',
    summary: 'Tổng kết',
    startTask: 'Bắt đầu nhiệm vụ',
    nextLab: 'Bài tiếp theo',
    finishLab: 'Hoàn thành bài Lab',
    confirmFinish: 'Xác nhận hoàn thành',
    resetLab: 'Khởi động lại Lab',
    aiTutor: 'Labby AI',
    terminal: 'Terminal',
    taskInstructions: 'Nhiệm vụ cần thực hiện trên Terminal:',
    taskPassed: '✓ Nhiệm vụ này đã được hoàn thành!',
    taskOnboarding: 'Hoạt động đọc hiểu (Onboarding):',
    hint: 'Gợi ý:',
    askAi: 'Hỏi Labby AI về bước này →',
    switchLang: 'Chuyển sang English'
  },
  en: {
    learn: 'Courses',
    roadmaps: 'Roadmaps',
    search: 'Search...',
    searchPlaceholder: 'Search courses or topics...',
    checkingEnv: 'Checking environment...',
    envReady: 'Ready',
    envNotReady: 'Not Ready',
    retry: 'Retry',
    lightMode: 'Switch to light mode',
    darkMode: 'Switch to dark mode',
    courseDetail: 'Course Detail',
    back: 'Back',
    continue: 'Continue',
    verify: 'Verify Result',
    reverify: 'Verify Again',
    verifying: 'Verifying...',
    copy: 'Copy',
    copied: 'Copied',
    completed: 'completed',
    sectionNumber: 'Section',
    task: 'Task',
    intro: 'Introduction',
    summary: 'Summary',
    startTask: 'Start Task',
    nextLab: 'Next Lab',
    finishLab: 'Complete Lab',
    confirmFinish: 'Confirm Completion',
    resetLab: 'Restart Lab',
    aiTutor: 'Labby AI',
    terminal: 'Terminal',
    taskInstructions: 'Task to perform in Terminal:',
    taskPassed: '✓ This task has been completed!',
    taskOnboarding: 'Reading & Onboarding Activity:',
    hint: 'Hint:',
    askAi: 'Ask Labby AI about this step →',
    switchLang: 'Chuyển sang Tiếng Việt'
  }
};

export function t(key, lang = getLang()) {
  return translations[lang]?.[key] || translations['vi']?.[key] || key;
}

