import { CourseGrade, DeadlineItem, ScheduleItem, DayOfWeek } from '../types';

// Standard Ministry of Education & Training (MOET) Vietnam Credit System Conversion (Thông tư 08/2021)
export function convertTenToFour(score: number): { letter: string; fourScale: number; classification: string } {
  if (score >= 8.5) return { letter: 'A', fourScale: 4.0, classification: 'Xuất sắc / Giỏi' };
  if (score >= 8.0) return { letter: 'B+', fourScale: 3.5, classification: 'Khá giỏi' };
  if (score >= 7.0) return { letter: 'B', fourScale: 3.0, classification: 'Khá' };
  if (score >= 6.5) return { letter: 'C+', fourScale: 2.5, classification: 'Trung bình khá' };
  if (score >= 5.5) return { letter: 'C', fourScale: 2.0, classification: 'Trung bình' };
  if (score >= 5.0) return { letter: 'D+', fourScale: 1.5, classification: 'Trung bình yếu' };
  if (score >= 4.0) return { letter: 'D', fourScale: 1.0, classification: 'Yếu (Đạt)' };
  return { letter: 'F', fourScale: 0.0, classification: 'Kém (Không đạt / Học lại)' };
}

// Compute individual course score
export function calculateCourseFinal(course: CourseGrade): {
  finalTen: number;
  letter: string;
  fourScale: number;
  classification: string;
} {
  const att = course.attendanceScore ?? 10;
  const mid = course.midtermScore ?? 8;
  const fin = course.finalScore ?? 8;

  const totalTen = +(
    att * course.attendanceWeight +
    mid * course.midtermWeight +
    fin * course.finalWeight
  ).toFixed(2);

  const { letter, fourScale, classification } = convertTenToFour(totalTen);
  return { finalTen: totalTen, letter, fourScale, classification };
}

// Compute Cumulative GPA
export function calculateCumulativeGpa(courses: CourseGrade[]): {
  gpaFour: number;
  gpaTen: number;
  totalCredits: number;
  classification: string;
} {
  if (courses.length === 0) {
    return { gpaFour: 0, gpaTen: 0, totalCredits: 0, classification: 'Chưa có môn học' };
  }

  let totalPointsFour = 0;
  let totalPointsTen = 0;
  let totalCredits = 0;

  for (const c of courses) {
    const { finalTen, fourScale } = calculateCourseFinal(c);
    totalPointsFour += fourScale * c.credits;
    totalPointsTen += finalTen * c.credits;
    totalCredits += c.credits;
  }

  const gpaFour = totalCredits > 0 ? +(totalPointsFour / totalCredits).toFixed(2) : 0;
  const gpaTen = totalCredits > 0 ? +(totalPointsTen / totalCredits).toFixed(2) : 0;

  let classification = 'Trung bình';
  if (gpaFour >= 3.6) classification = 'Xuất sắc';
  else if (gpaFour >= 3.2) classification = 'Giỏi';
  else if (gpaFour >= 2.5) classification = 'Khá';
  else if (gpaFour >= 2.0) classification = 'Trung bình';
  else classification = 'Yếu / Cảnh báo học vụ';

  return { gpaFour, gpaTen, totalCredits, classification };
}

// Calculate target final exam score needed
export function calculateRequiredFinalExam(
  attendance: number,
  midterm: number,
  attendanceWeight: number,
  midtermWeight: number,
  finalWeight: number,
  targetLetter: string
): { requiredScore: number; isAchievable: boolean; message: string } {
  let targetMinTen = 8.5; // Default for A
  if (targetLetter === 'A') targetMinTen = 8.5;
  else if (targetLetter === 'B+') targetMinTen = 8.0;
  else if (targetLetter === 'B') targetMinTen = 7.0;
  else if (targetLetter === 'C+') targetMinTen = 6.5;
  else if (targetLetter === 'C') targetMinTen = 5.5;
  else if (targetLetter === 'D') targetMinTen = 4.0;

  const currentPoints = attendance * attendanceWeight + midterm * midtermWeight;
  const needed = (targetMinTen - currentPoints) / finalWeight;
  const rounded = +needed.toFixed(1);

  if (rounded <= 0) {
    return { requiredScore: 0, isAchievable: true, message: `Điểm quá trình của bạn đã rất cao! Điểm thi chỉ cần >= 0 là đạt điểm ${targetLetter}.` };
  }
  if (rounded > 10) {
    return { requiredScore: rounded, isAchievable: false, message: `Rất tiếc, bạn cần tối thiểu ${rounded} điểm thi (vượt quá 10.0) để đạt điểm ${targetLetter}. Hãy đặt mục tiêu điểm kế cận.` };
  }
  return { requiredScore: rounded, isAchievable: true, message: `Bạn cần đạt tối thiểu ${rounded} điểm trong kỳ thi cuối kỳ để đạt điểm ${targetLetter}.` };
}

// Convert today's day of week to Vietnamese code
export function getTodayDayOfWeek(): DayOfWeek {
  const day = new Date().getDay();
  // 0 is Sunday, 1 is Monday ...
  switch (day) {
    case 1: return 'T2';
    case 2: return 'T3';
    case 3: return 'T4';
    case 4: return 'T5';
    case 5: return 'T6';
    case 6: return 'T7';
    default: return 'CN';
  }
}

export function getDayLabel(code: DayOfWeek): string {
  switch (code) {
    case 'T2': return 'Thứ Hai';
    case 'T3': return 'Thứ Ba';
    case 'T4': return 'Thứ Tư';
    case 'T5': return 'Thứ Năm';
    case 'T6': return 'Thứ Sáu';
    case 'T7': return 'Thứ Bảy';
    case 'CN': return 'Chủ Nhật';
  }
}

// Calculate remaining time for deadline
export function getDeadlineCountdown(dueDateIso: string): {
  text: string;
  isUrgent: boolean; // < 24 hours
  isOverdue: boolean;
  hoursRemaining: number;
} {
  const diff = new Date(dueDateIso).getTime() - Date.now();
  if (diff <= 0) {
    return { text: 'Đã hết hạn', isUrgent: true, isOverdue: true, hoursRemaining: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return {
      text: `Còn ${days} ngày ${remainingHours} giờ`,
      isUrgent: days <= 1,
      isOverdue: false,
      hoursRemaining: hours,
    };
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return {
    text: `Còn ${hours} giờ ${minutes} phút`,
    isUrgent: true,
    isOverdue: false,
    hoursRemaining: hours,
  };
}

// Web Audio Soft Chime Generator for study alerts
export function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.2); // G5
    gain2.gain.setValueAtTime(0.15, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio chime unsupported or blocked', e);
  }
}
