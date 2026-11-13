import React, { useState } from 'react';
import { DeadlineItem } from '../types';
import { getDeadlineCountdown, playGentleChime } from '../utils/academicUtils';
import { CheckCircle2, Circle, Clock, Plus, AlertCircle, Calendar, Trash2, Tag, Check, Filter } from 'lucide-react';

interface Props {
  deadlines: DeadlineItem[];
  onUpdateDeadlines: (newDeadlines: DeadlineItem[]) => void;
}

export const DeadlineTracker: React.FC<Props> = ({ deadlines, onUpdateDeadlines }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [type, setType] = useState<DeadlineItem['type']>('assignment');
  const [description, setDescription] = useState('');

  const handleToggleComplete = (id: string) => {
    onUpdateDeadlines(
      deadlines.map((d) => {
        if (d.id === id) {
          const newStatus = d.status === 'completed' ? 'pending' : 'completed';
          if (newStatus === 'completed') {
            playGentleChime();
          }
          return { ...d, status: newStatus };
        }
        return d;
      })
    );
  };

  const handleDelete = (id: string) => {
    onUpdateDeadlines(deadlines.filter((d) => d.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const newItem: DeadlineItem = {
      id: `dl-${Date.now()}`,
      title,
      subjectName: subjectName || 'Chung',
      dueDate,
      priority,
      status: 'pending',
      type,
      description,
    };

    onUpdateDeadlines([...deadlines, newItem]);
    setIsModalOpen(false);
    setTitle('');
    setSubjectName('');
    setDueDate('');
    setDescription('');
  };

  const filtered = deadlines.filter((d) => {
    if (filterStatus === 'pending') return d.status !== 'completed';
    if (filterStatus === 'completed') return d.status === 'completed';
    return true;
  });

  const pendingCount = deadlines.filter((d) => d.status !== 'completed').length;
  const completedCount = deadlines.filter((d) => d.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Quản Lý Deadline & Lịch Thi Đếm Ngược
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Không bỏ sót bài tập, tiểu luận, thuyết trình hay kỳ thi kết thúc học phần
          </p>
        </div>

        <button
          onClick={() => {
            const defaultDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16);
            setDueDate(defaultDate);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm Deadline Mới
        </button>
      </div>

      {/* Filter Tabs & Counters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({deadlines.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'pending' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa xong ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'completed' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã hoàn thành ({completedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Tip: Bấm vào vòng tròn để đánh dấu đã làm xong bài!
        </span>
      </div>

      {/* Deadlines List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-700">Tuyệt vời! Không có deadline nào đang chờ</h4>
            <p className="text-xs text-slate-500 mt-1">
              Bạn đã xử lý hết các nhiệm vụ cần thiết hoặc chưa thêm bài tập mới.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const countdown = getDeadlineCountdown(item.dueDate);
            const isDone = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/60 opacity-75'
                    : countdown.isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : countdown.isUrgent
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                    title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {item.subjectName}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority === 'high' ? 'Gấp' : item.priority === 'medium' ? 'Bình thường' : 'Thong thả'}
                      </span>

                      <span className="text-[10px] font-medium text-slate-400 capitalize">
                        {item.type === 'assignment' ? 'Bài tập' : item.type === 'presentation' ? 'Thuyết trình' : item.type === 'midterm' ? 'Giữa kỳ' : 'Dự án'}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold text-slate-900 ${isDone ? 'line-through text-slate-500' : ''}`}>
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400 flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Hạn: {new Date(item.dueDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    
                    {!isDone ? (
                      <span
                        className={`inline-block text-xs font-bold mt-0.5 px-2 py-0.5 rounded-md ${
                          countdown.isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : countdown.isUrgent
                            ? 'bg-amber-100 text-amber-800 font-extrabold animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        ⏳ {countdown.text}
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold text-emerald-600 mt-0.5">
                        ✓ Đã hoàn tất
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition"
                    title="Xóa deadline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Deadline Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Thêm Deadline / Kỳ Thi Mới
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nhiệm vụ / Tên bài tập *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nộp slide thuyết trình nhóm, Bài tập lớn..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học liên quan</label>
                <input
                  type="text"
                  placeholder="Kinh tế vi mô, Triết học, Toán cao cấp..."
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn nộp (Ngày & Giờ) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức ưu tiên</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="high">🔴 Cao (Gấp)</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="low">🟢 Thấp (Còn nhiều thời gian)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                >
                  <option value="assignment">Bài tập về nhà (Assignment)</option>
                  <option value="presentation">Thuyết trình nhóm (Presentation)</option>
                  <option value="project">Bài tập lớn / Dự án (Project)</option>
                  <option value="midterm">Kiểm tra giữa kỳ (Midterm)</option>
                  <option value="final">Thi kết thúc học phần (Final)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Yêu cầu chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú yêu cầu nộp file pdf, link nộp bài trên LMS..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition"
                >
                  Lưu Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
