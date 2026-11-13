import React, { useState, useEffect } from 'react';
import { ScheduleItem, DeadlineItem } from '../types';
import { getTodayDayOfWeek, getDayLabel, getDeadlineCountdown, playGentleChime } from '../utils/academicUtils';
import { Bell, Clock, AlertTriangle, CheckCircle, Volume2, Calendar, BookOpen, Sparkles, X } from 'lucide-react';

interface Props {
  schedule: ScheduleItem[];
  deadlines: DeadlineItem[];
  onNavigate: (tab: string) => void;
}

export const ActiveReminders: React.FC<Props> = ({ schedule, deadlines, onNavigate }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('unibuddy_sound_enabled') === 'true';
  });
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [lastChimeTime, setLastChimeTime] = useState<number>(0);

  const todayCode = getTodayDayOfWeek();
  const todayClasses = schedule.filter((item) => item.dayOfWeek === todayCode);

  // Urgent deadlines (< 36 hours remaining and not completed)
  const urgentDeadlines = deadlines.filter((d) => {
    if (d.status === 'completed') return false;
    const { hoursRemaining, isOverdue } = getDeadlineCountdown(d.dueDate);
    return isOverdue || hoursRemaining <= 36;
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('unibuddy_sound_enabled', String(next));
    if (next) {
      playGentleChime();
    }
  };

  // Play gentle chime on first load if there are urgent deadlines and sound enabled
  useEffect(() => {
    if (soundEnabled && urgentDeadlines.length > 0 && Date.now() - lastChimeTime > 60000) {
      playGentleChime();
      setLastChimeTime(Date.now());
    }
  }, [soundEnabled, urgentDeadlines.length]);

  const dismiss = (id: string) => {
    setDismissedReminders((prev) => [...prev, id]);
  };

  const activeUrgentDeadlines = urgentDeadlines.filter((d) => !dismissedReminders.includes(d.id));

  return (
    <div className="space-y-3 mb-6">
      {/* Top Smart Banner: Today's schedule quick glance & Reminder switch */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                <Bell className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Nhắc nhở học tập chủ động
              </span>
              <span className="text-xs text-white/80">
                {getDayLabel(todayCode)}, {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {todayClasses.length > 0 ? (
                <>Hôm nay bạn có <span className="text-amber-300 font-extrabold">{todayClasses.length} ca học</span> cần tham dự</>
              ) : (
                <>Hôm nay bạn <span className="text-emerald-200">không có lịch học</span> trên lớp. Nghỉ ngơi hoặc tự ôn tập nhé!</>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 mt-1 line-clamp-1">
              {todayClasses.length > 0
                ? `Ca tiếp theo: ${todayClasses[0].subjectName} (${todayClasses[0].shift}) tại phòng ${todayClasses[0].room}`
                : 'Hãy dành thời gian đọc trước tài liệu hoặc ghé Góc Tâm Sự để chia sẻ cảm xúc.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                soundEnabled
                  ? 'bg-amber-400 text-slate-900 border-amber-300 font-semibold shadow-sm'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              title="Bật/tắt âm thanh chuông nhắc nhở học tập"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {soundEnabled ? 'Chuông nhắc: BẬT' : 'Bật chuông'}
            </button>

            <button
              onClick={() => onNavigate('timetable')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-emerald-800 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              Xem TKB Hôm Nay
            </button>
          </div>
        </div>

        {/* Today's Classes pills preview if any */}
        {todayClasses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayClasses.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('timetable')}
                className="bg-white/10 hover:bg-white/15 cursor-pointer backdrop-blur-md rounded-xl p-2.5 text-xs transition border border-white/10 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-white truncate max-w-[200px]">{item.subjectName}</div>
                  <div className="text-white/80 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{item.startTime} - {item.endTime} ({item.shift.split('(')[0].trim()})</span>
                  </div>
                  <div className="text-amber-200 font-medium mt-0.5">Phòng: {item.room}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                  {item.credits} tín
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Deadline Alert Banner (if any) */}
      {activeUrgentDeadlines.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-3.5 shadow-sm text-slate-800 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-2">
                  Cảnh báo Deadline gấp ({activeUrgentDeadlines.length} bài cần nộp!)
                </h4>
                <div className="space-y-1.5 mt-1.5">
                  {activeUrgentDeadlines.slice(0, 2).map((dl) => {
                    const cd = getDeadlineCountdown(dl.dueDate);
                    return (
                      <div key={dl.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900">{dl.title}</span>
                        <span className="text-slate-500">({dl.subjectName})</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          cd.isOverdue
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-200 text-amber-900'
                        }`}>
                          {cd.text}
                        </span>
                        <button
                          onClick={() => dismiss(dl.id)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] underline ml-1"
                        >
                          Bỏ qua
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('deadlines')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
            >
              Xử lý ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
