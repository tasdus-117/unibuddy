import React, { useState, useEffect } from 'react';
import { ScheduleItem, DeadlineItem, CourseGrade, StudentProfile } from './types';
import { INITIAL_SCHEDULE, INITIAL_DEADLINES, INITIAL_COURSES } from './data/sampleData';
import { Navbar } from './components/Navbar';
import { ActiveReminders } from './components/ActiveReminders';
import { AIStudentAdvisor } from './components/AIStudentAdvisor';
import { TimetableManager } from './components/TimetableManager';
import { DeadlineTracker } from './components/DeadlineTracker';
import { GpaCalculator } from './components/GpaCalculator';
import { FreshmanCorner } from './components/FreshmanCorner';
import { StudyFocusPomodoro } from './components/StudyFocusPomodoro';
import { StudentProfileModal } from './components/StudentProfileModal';
import { calculateCumulativeGpa, getTodayDayOfWeek } from './utils/academicUtils';

const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  fullName: 'Nguyễn Minh Anh',
  studentId: '25A4041234',
  university: 'Học viện Ngân hàng (HVNH)',
  major: 'Tài chính - Ngân hàng',
  academicYear: 'Năm 1 (Tân sinh viên)',
  email: 'minhanh.sv@hvnh.edu.vn',
  phone: '0912 345 678',
  targetGpa: 3.6,
  bio: 'Phấn đấu đạt học bổng khuyến khích học tập kỳ này và nâng cao kỹ năng tiếng Anh chuyên ngành.',
  themeColor: 'emerald',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ai-advisor');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isProfileSetupDone, setIsProfileSetupDone] = useState<boolean>(() => {
    return localStorage.getItem('unibuddy_profile_setup_done') === 'true';
  });

  // Student profile state with LocalStorage
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('unibuddy_student_profile');
    if (saved) {
      try {
        return { ...DEFAULT_STUDENT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_STUDENT_PROFILE;
  });

  // Schedule state with LocalStorage
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('unibuddy_schedule');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SCHEDULE;
  });

  // Deadlines state with LocalStorage
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(() => {
    const saved = localStorage.getItem('unibuddy_deadlines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_DEADLINES;
  });

  // GPA Courses state with LocalStorage
  const [courses, setCourses] = useState<CourseGrade[]>(() => {
    const saved = localStorage.getItem('unibuddy_courses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COURSES;
  });

  useEffect(() => {
    localStorage.setItem('unibuddy_student_profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

  const handleSaveStudentProfile = (updated: StudentProfile) => {
    setStudentProfile(updated);
    setIsProfileSetupDone(true);
    localStorage.setItem('unibuddy_profile_setup_done', 'true');
  };

  useEffect(() => {
    localStorage.setItem('unibuddy_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('unibuddy_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

  useEffect(() => {
    localStorage.setItem('unibuddy_courses', JSON.stringify(courses));
  }, [courses]);

  const handleResetSampleData = () => {
    if (window.confirm('Khôi phục lại dữ liệu mẫu chuẩn của sinh viên đại học? (Thời khóa biểu, Deadlines, Điểm GPA, Biểu đồ học kỳ)')) {
      setSchedule(INITIAL_SCHEDULE);
      setDeadlines(INITIAL_DEADLINES);
      setCourses(INITIAL_COURSES);
      localStorage.setItem('unibuddy_schedule', JSON.stringify(INITIAL_SCHEDULE));
      localStorage.setItem('unibuddy_deadlines', JSON.stringify(INITIAL_DEADLINES));
      localStorage.setItem('unibuddy_courses', JSON.stringify(INITIAL_COURSES));
      localStorage.removeItem('unibuddy_semester_history');
      window.location.reload();
    }
  };

  const todayClassesCount = schedule.filter((s) => s.dayOfWeek === getTodayDayOfWeek()).length;
  const pendingDeadlinesCount = deadlines.filter((d) => d.status !== 'completed').length;
  const { gpaFour, totalCredits } = calculateCumulativeGpa(courses);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-20 md:pb-8">
      {/* Top Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingDeadlinesCount={pendingDeadlinesCount}
        todayClassesCount={todayClassesCount}
        onResetSampleData={handleResetSampleData}
        onOpenProfile={() => setIsProfileOpen(true)}
        studentName={isProfileSetupDone ? studentProfile.fullName : undefined}
        studentAvatar={isProfileSetupDone ? studentProfile.avatarUrl : undefined}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={studentProfile}
        onSaveProfile={handleSaveStudentProfile}
        currentGpa={gpaFour}
        totalCredits={totalCredits}
        pendingDeadlinesCount={pendingDeadlinesCount}
        isFirstTimeSetup={!isProfileSetupDone}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Active Smart Reminder Banner visible on top (hidden on GPA and Freshman Handbook tabs) */}
        {activeTab !== 'gpa' && activeTab !== 'freshman' && (
          <ActiveReminders
            schedule={schedule}
            deadlines={deadlines}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'ai-advisor' && (
          <AIStudentAdvisor
            studentUniversity={studentProfile.university}
            studentMajor={studentProfile.major}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableManager
            schedule={schedule}
            onUpdateSchedule={setSchedule}
          />
        )}

        {activeTab === 'deadlines' && (
          <DeadlineTracker
            deadlines={deadlines}
            onUpdateDeadlines={setDeadlines}
          />
        )}

        {activeTab === 'gpa' && (
          <GpaCalculator
            courses={courses}
            onUpdateCourses={setCourses}
          />
        )}

        {activeTab === 'freshman' && (
          <FreshmanCorner
            onStartCompanionChat={() => {
              setActiveTab('ai-advisor');
            }}
          />
        )}

        {activeTab === 'pomodoro' && <StudyFocusPomodoro />}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          UniBuddy VN © 2026 - Nền tảng đồng hành toàn diện cho sinh viên và tân sinh viên Việt Nam.
        </p>
      </footer>
    </div>
  );
}
