import React, { useState } from 'react';
import { ScheduleItem, DayOfWeek } from '../types';
import { getTodayDayOfWeek, getDayLabel } from '../utils/academicUtils';
import { AutoScheduleImporter } from './AutoScheduleImporter';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  BookOpen,
  Trash2,
  Edit3,
  Sparkles,
  Filter,
  ChevronRight,
  Camera,
  Link2,
  UploadCloud
} from 'lucide-react';

interface Props {
  schedule: ScheduleItem[];
  onUpdateSchedule: (newSchedule: ScheduleItem[]) => void;
}

const DAYS: DayOfWeek[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const SHIFTS = [
  { label: 'Ca 1 (07:00 - 09:30)', start: '07:00', end: '09:30' },
  { label: 'Ca 2 (09:45 - 12:15)', start: '09:45', end: '12:15' },
  { label: 'Ca 3 (13:00 - 15:30)', start: '13:00', end: '15:30' },
  { label: 'Ca 4 (15:45 - 18:15)', start: '15:45', end: '18:15' },
  { label: 'Ca Tối (18:30 - 21:00)', start: '18:30', end: '21:00' },
];

export const TimetableManager: React.FC<Props> = ({ schedule, onUpdateSchedule }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>(getTodayDayOfWeek());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('T2');
  const [shiftIndex, setShiftIndex] = useState(0);
  const [room, setRoom] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [credits, setCredits] = useState(3);
  const [notes, setNotes] = useState('');

  const todayCode = getTodayDayOfWeek();

  const handleOpenAdd = () => {
    setEditingId(null);
    setSubjectName('');
    setSubjectCode('');
    setDayOfWeek(selectedDay === 'all' ? 'T2' : selectedDay);
    setShiftIndex(0);
    setRoom('');
    setLecturer('');
    setCredits(3);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setSubjectName(item.subjectName);
    setSubjectCode(item.subjectCode);
    setDayOfWeek(item.dayOfWeek);
    const foundShiftIdx = SHIFTS.findIndex((s) => s.start === item.startTime);
    setShiftIndex(foundShiftIdx >= 0 ? foundShiftIdx : 0);
    setRoom(item.room);
    setLecturer(item.lecturer || '');
    setCredits(item.credits);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa ca học này khỏi thời khóa biểu?')) {
      onUpdateSchedule(schedule.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    const chosenShift = SHIFTS[shiftIndex];
    const colors = ['emerald', 'blue', 'indigo', 'purple', 'rose', 'amber'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    if (editingId) {
      onUpdateSchedule(
        schedule.map((item) =>
          item.id === editingId
            ? {
                ...item,
                subjectName,
                subjectCode: subjectCode || 'HP01',
                dayOfWeek,
                shift: chosenShift.label,
                startTime: chosenShift.start,
                endTime: chosenShift.end,
                room: room || 'Giảng đường',
                lecturer,
                credits,
                notes,
              }
            : item
        )
      );
    } else {
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}`,
        subjectName,
        subjectCode: subjectCode || 'HP01',
        dayOfWeek,
        shift: chosenShift.label,
        startTime: chosenShift.start,
        endTime: chosenShift.end,
        room: room || 'Giảng đường',
        lecturer,
        credits,
        type: 'lecture',
        notes,
        color: randomColor,
      };
      onUpdateSchedule([...schedule, newItem]);
    }

    setIsModalOpen(false);
  };

  const filteredSchedule = selectedDay === 'all'
    ? schedule
    : schedule.filter((item) => item.dayOfWeek === selectedDay);

  // Group by day for "all" view
  const getItemsForDay = (d: DayOfWeek) => schedule.filter((s) => s.dayOfWeek === d);

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Thời Khóa Biểu & Lịch Học Đại Học
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý ca học, phòng học, giảng viên và thông báo vào lớp tự động
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-sm transition"
            title="Sử dụng ảnh chụp hoặc đường link để tự động tạo thời khóa biểu"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Nhập Tự Động Từ Ảnh / Link</span>
          </button>

          <button
            onClick={() => setSelectedDay(todayCode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              selectedDay === todayCode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Hôm nay ({getDayLabel(todayCode)})
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Thêm Thủ Công
          </button>
        </div>
      </div>

      {/* Smart Quick Banner for Image / Link import */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>Tính năng mới: Thiết lập thời khóa biểu tự động trong 3 giây</span>
              <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                AI Vision
              </span>
            </h4>
            <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Bạn có ảnh chụp màn hình từ cổng sinh viên (portal đăng ký tín chỉ) hoặc link tra cứu TKB? Hãy để AI tự động nhận diện môn, ca học và phòng học!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsImporterOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
        >
          <UploadCloud className="w-4 h-4 text-emerald-200" />
          <span>Tải Ảnh / Dán Link Ngay</span>
        </button>
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            selectedDay === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Cả tuần ({schedule.length} ca)
        </button>

        {DAYS.map((d) => {
          const count = schedule.filter((s) => s.dayOfWeek === d).length;
          const isToday = d === todayCode;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 relative ${
                selectedDay === d
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{getDayLabel(d)}</span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${selectedDay === d ? 'bg-amber-300' : 'bg-emerald-500'}`} />
              )}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedDay === d ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content View: Single Day or Full Week Grid */}
      {selectedDay !== 'all' ? (
        <div className="space-y-3">
          {filteredSchedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Không có lịch học vào {getDayLabel(selectedDay)}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Bạn có thể tự do nghỉ ngơi, tham gia câu lạc bộ hoặc bấm nút bên dưới để thêm môn học mới.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition"
              >
                + Thêm môn học cho {getDayLabel(selectedDay)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSchedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {item.subjectCode}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {item.credits} tín chỉ
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.subjectName}</h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{item.shift}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Phòng học: <strong className="text-slate-800 font-semibold">{item.room}</strong></span>
                    </div>

                    {item.lecturer && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>Giảng viên: <strong className="text-slate-700">{item.lecturer}</strong></span>
                      </div>
                    )}

                    {item.notes && (
                      <div className="p-2 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-100 mt-2">
                        <strong>Ghi chú:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Full Week Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DAYS.map((d) => {
            const dayItems = getItemsForDay(d);
            const isToday = d === todayCode;
            return (
              <div
                key={d}
                className={`bg-white rounded-2xl p-3.5 border transition ${
                  isToday ? 'border-emerald-400 shadow-sm ring-1 ring-emerald-400' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800">
                    <span>{getDayLabel(d)}</span>
                    {isToday && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-md">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{dayItems.length} ca</span>
                </div>

                {dayItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">Trống lịch</p>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenEdit(item)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 cursor-pointer transition text-xs"
                      >
                        <div className="font-bold text-slate-900 line-clamp-1">{item.subjectName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>{item.startTime} - {item.endTime}</span>
                          <span className="font-semibold text-emerald-700">{item.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {editingId ? 'Chỉnh sửa môn học' : 'Thêm môn học mới vào TKB'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học / Học phần *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kinh tế Vi mô, Triết học Mác-Lênin..."
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã học phần</label>
                  <input
                    type="text"
                    placeholder="ECO101"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số tín chỉ</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thứ trong tuần</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {getDayLabel(d)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ca học</label>
                  <select
                    value={shiftIndex}
                    onChange={(e) => setShiftIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {SHIFTS.map((s, idx) => (
                      <option key={idx} value={idx}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng học / Giảng đường</label>
                  <input
                    type="text"
                    placeholder="D.302 / Hội trường A"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giảng viên phụ trách</label>
                  <input
                    type="text"
                    placeholder="TS. Nguyễn Văn A"
                    value={lecturer}
                    onChange={(e) => setLecturer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú (bài tập, slide, link)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú bài tập hoặc tài liệu cần mang theo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {editingId ? 'Lưu thay đổi' : 'Thêm vào TKB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Schedule Importer Modal */}
      <AutoScheduleImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSchedule={(newItems, mode) => {
          if (mode === 'replace') {
            onUpdateSchedule(newItems);
          } else {
            onUpdateSchedule([...schedule, ...newItems]);
          }
        }}
      />
    </div>
  );
};
