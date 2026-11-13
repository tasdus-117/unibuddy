import React from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Timer,
  Bot,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingDeadlinesCount: number;
  todayClassesCount: number;
  onResetSampleData: () => void;
  onOpenProfile: () => void;
  studentName?: string;
  studentAvatar?: string;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingDeadlinesCount,
  todayClassesCount,
  onResetSampleData,
  onOpenProfile,
  studentName,
  studentAvatar,
}) => {
  const navItems = [
    { id: 'ai-advisor', label: 'AI Cố Vấn & Q&A', icon: Bot, badge: 'Mới' },
    { id: 'timetable', label: 'Thời Khóa Biểu', icon: Calendar, badge: todayClassesCount > 0 ? `${todayClassesCount} ca` : undefined },
    { id: 'deadlines', label: 'Deadline & Thi', icon: Clock, badge: pendingDeadlinesCount > 0 ? `${pendingDeadlinesCount}` : undefined },
    { id: 'gpa', label: 'Tính Điểm GPA', icon: Award },
    { id: 'freshman', label: 'Cẩm Nang Sinh Viên', icon: BookOpen },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[80px]" style={{ height: '80px' }}>
          <div className="flex items-center justify-between h-full">
            {/* Logo - Click to view & edit student profile */}
            <button
              type="button"
              onClick={onOpenProfile}
              title="Xem & chỉnh sửa hồ sơ sinh viên của bạn"
              className="flex items-center gap-2.5 cursor-pointer group select-none text-left rounded-2xl p-1 -ml-1 hover:bg-slate-50 transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {studentAvatar ? (
                  <img
                    src={studentAvatar}
                    alt={studentName || 'UniBuddy'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                    UniBuddy <span className="text-emerald-600">VN</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    Sinh Viên 4.0
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-700 tracking-wide hidden sm:block">
                  {studentName ? `Hồ sơ: ${studentName}` : 'Thiết lập hồ sơ của bạn'}
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition relative ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          item.badge === 'Mới'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Reset sample data & school badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={onResetSampleData}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition"
                title="Tải lại dữ liệu mẫu của sinh viên đại học"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Dữ liệu mẫu
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>HVNH & ĐH Toàn Quốc</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for responsive phone usage) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition relative flex-1 ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                {item.id === 'ai-advisor' ? 'AI Cố Vấn' : item.id === 'timetable' ? 'Lịch Học' : item.id === 'deadlines' ? 'Deadline' : item.id === 'gpa' ? 'Điểm GPA' : item.id === 'freshman' ? 'Cẩm Nang' : 'Pomodoro'}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
