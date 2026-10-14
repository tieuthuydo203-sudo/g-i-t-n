import { Student, ClassRoom, GameSettings } from './types';

export const DEFAULT_STUDENT_NAMES: { name: string; gender: 'boy' | 'girl' }[] = [
  { name: 'Đoàn Minh Đức', gender: 'boy' },
  { name: 'Nguyễn Bùi Gia Huy', gender: 'boy' },
  { name: 'Phương Linh', gender: 'girl' },
  { name: 'Quỳnh Anh', gender: 'girl' },
  { name: 'Tuấn Minh', gender: 'boy' },
  { name: 'Khắc Khoa', gender: 'boy' },
  { name: 'Mạnh Dũng', gender: 'boy' },
  { name: 'Hải Đăng', gender: 'boy' },
  { name: 'Huy Khánh', gender: 'boy' },
  { name: 'Bảo Ngọc', gender: 'girl' },
  { name: 'Thanh Thảo', gender: 'girl' },
  { name: 'Khánh An', gender: 'girl' },
  { name: 'Việt Hoàng', gender: 'boy' },
  { name: 'Trúc Mai', gender: 'girl' },
  { name: 'Hoàng Long', gender: 'boy' },
  { name: 'Đình Trọng', gender: 'boy' },
  { name: 'Hồng Nhung', gender: 'girl' },
  { name: 'Thế Anh', gender: 'boy' },
  { name: 'Nhật Linh', gender: 'girl' },
  { name: 'Quang Khải', gender: 'boy' },
  { name: 'Mai Anh', gender: 'girl' },
  { name: 'Minh Thư', gender: 'girl' },
  { name: 'Tiến Đạt', gender: 'boy' },
  { name: 'Khánh Linh', gender: 'girl' },
  { name: 'Đức Huy', gender: 'boy' },
  { name: 'Kim Ngân', gender: 'girl' },
  { name: 'Quốc Bảo', gender: 'boy' },
  { name: 'Thảo My', gender: 'girl' },
  { name: 'Hữu Phước', gender: 'boy' },
  { name: 'Diệu Huyền', gender: 'girl' },
  { name: 'Văn Nam', gender: 'boy' },
  { name: 'Gia Bảo', gender: 'boy' },
  { name: 'Ngọc Hân', gender: 'girl' },
  { name: 'Bảo Trâm', gender: 'girl' },
  { name: 'Hoàng Bách', gender: 'boy' },
  { name: 'Thùy Chi', gender: 'girl' },
  { name: 'Minh Khang', gender: 'boy' },
  { name: 'Tuệ Mẫn', gender: 'girl' },
];

export const FUNNY_SPEECHES = {
  idle: [
    'Hôm nay trời đẹp ghê!',
    'Học thuộc bài chưa m?',
    'Lát ăn trà sữa nha!',
    'Bánh mì ở đây ngon xỉu!',
    'Chắc hôm nay không khảo bài đâu...',
  ],
  warning: [
    'Ủa cái gì trên trời dợ?!',
    'Trời tự nhiên tối sầm vậy?!',
    'Gì vậy trời?!',
    'Cái đĩa bay kìa bà con!',
    'Có biến rồi anh em ơi!',
  ],
  panic: [
    'Cứu tui với!!',
    'Chạy mau anh em ơi!!',
    'Đừng bắt em mà!!',
    'Em chưa học bài!!',
    'Ôi mẹ ơi cứu con!!',
    'Chạy lẹ chạy lẹ!!',
    'Cho em lượt sau đi mà!!',
    'Cứu tui, sắp bay lên rồi!',
  ],
  captured: [
    'Thầy ơi cứu em!!',
    'Em thuộc bài rồi mà!!',
    'Sao lại là em?!',
    'Đừng bắt em đi sao Hỏa!!',
    'Trời ơi là trời, lộn ngược rồi!!',
    'Em xin hứa trả bài 10 điểm!!',
    'Áo thể dục mới giặt mà!!',
  ],
  relief: [
    'Hú hồn chim én!',
    'Thoát nạn rồi may quá!',
    'Chóng mặt muốn xỉu!',
    'Run rẩy cả chân tay!',
    'Chia buồn cùng các bạn!',
  ],
};

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class_12a1',
    name: 'Lớp 12A1',
    students: DEFAULT_STUDENT_NAMES.map((item, idx) => ({
      id: `std_${idx + 1}`,
      name: item.name,
      gender: item.gender,
      hairStyle: idx % 6,
      hairColor: idx % 3 === 0 ? '#1f2937' : idx % 3 === 1 ? '#111827' : '#374151',
      pantsColor: '#881337', // Đỏ đô
      shirtColor: '#facc15', // Áo thể thao vàng
      collarColor: '#881337', // Cổ bẻ đỏ đô
    })),
  },
  {
    id: 'class_11b2',
    name: 'Lớp 11B2',
    students: DEFAULT_STUDENT_NAMES.slice(0, 30).map((item, idx) => ({
      id: `std_b2_${idx + 1}`,
      name: item.name,
      gender: item.gender,
      hairStyle: (idx + 2) % 6,
      hairColor: '#1e293b',
      pantsColor: '#881337',
      shirtColor: '#facc15',
      collarColor: '#881337',
    })),
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  pickCount: 2,
  speed: 'normal',
  noRepeat: false,
  showLabels: true,
  showSpeech: true,
  soundEnabled: true,
  soundVolume: 0.8,
  resultTitle: 'Mời các bạn lên bảng trả bài',
  resultSubtitle: 'LỆNH TRIỆU TẬP LIÊN HÀNH TINH',
  teacherCredit: '',
};
