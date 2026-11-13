export type QAMode = 'academic' | 'university_info' | 'freshman_empathy' | 'study_method';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: QAMode;
  suggestions?: string[];
  sources?: GroundingSource[];
  modelLabel?: string;
}

export type DayOfWeek = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';

export interface ScheduleItem {
  id: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: DayOfWeek;
  shift: string; // e.g. "Ca 1 (07:00 - 09:30)", "Ca 2 (09:45 - 12:15)", "Ca 3 (13:00 - 15:30)", "Ca 4 (15:45 - 18:15)", "Ca tối (18:30 - 21:00)"
  startTime: string; // "07:00"
  endTime: string;   // "09:30"
  room: string;      // e.g. "D.301 - Giảng đường D"
  lecturer?: string; // e.g. "TS. Nguyễn Văn A"
  credits: number;   // e.g. 3
  type: 'lecture' | 'lab' | 'online' | 'exam';
  notes?: string;
  color: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string; // YYYY-MM-DDTHH:mm
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  type: 'assignment' | 'project' | 'presentation' | 'midterm' | 'final';
}

export interface CourseGrade {
  id: string;
  name: string;
  credits: number;
  attendanceScore?: number; // Điểm chuyên cần (10%)
  midtermScore?: number;    // Điểm giữa kỳ (20-30%)
  finalScore?: number;      // Điểm cuối kỳ (50-70%)
  attendanceWeight: number; // e.g. 0.1
  midtermWeight: number;    // e.g. 0.3
  finalWeight: number;      // e.g. 0.6
  letterGrade?: string;     // A, B+, B, C+, C, D+, D, F
  fourScaleGrade?: number;  // 4.0, 3.5, 3.0...
  tenScaleGrade?: number;   // 8.5, 7.2...
}

export interface SemesterGpaRecord {
  id: string;
  semesterName: string; // e.g. "Kỳ 1 (Năm 1)", "Kỳ 2 (Năm 1)", "Kỳ 1 (Năm 2)"...
  gpaFour: number;      // Điểm GPA kỳ đó (thang 4)
  cpaFour: number;      // Điểm CPA tích lũy đến kỳ đó
  gpaTen: number;       // Điểm GPA hệ 10
  credits: number;      // Số tín chỉ tích lũy trong kỳ
  classification: string; // Xuất sắc, Giỏi, Khá...
}

export interface FreshmanGuideArticle {
  id: string;
  title: string;
  category: 'safety' | 'finance' | 'psychology' | 'study' | 'roommate';
  summary: string;
  readTime: string;
  content: string[];
  tips: string[];
  icon: string;
}

export interface MoodLog {
  id: string;
  date: string;
  mood: 'happy' | 'peaceful' | 'stressed' | 'homesick' | 'tired' | 'energized';
  note?: string;
  aiEncouragement?: string;
}

export interface UniversityProfile {
  id: string;
  shortName: string;
  fullName: string;
  location: string;
  badgeColor: string;
  highlights: string[];
  samplePrograms: string[];
  dormitoryInfo: string;
  scholarshipInfo: string;
  admissionInfo: string;
}

export interface StudentProfile {
  fullName: string;
  studentId: string;
  university: string;
  major: string;
  academicYear: string;
  email: string;
  phone: string;
  targetGpa: number;
  bio: string;
  themeColor: 'emerald' | 'indigo' | 'teal' | 'rose' | 'amber';
  avatarUrl?: string;
}
