import React, { useState } from 'react';
import { FRESHMAN_ARTICLES } from '../data/sampleData';
import { FreshmanGuideArticle } from '../types';
import {
  Heart,
  Smile,
  Frown,
  Coffee,
  Sun,
  CheckSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageCircleHeart,
  Plus,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface Props {
  onStartCompanionChat: (customPrompt?: string) => void;
}

const MOODS = [
  { id: 'happy', label: 'Vui vẻ & Phấn chấn', icon: Smile, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'homesick', label: 'Nhớ nhà & Lạc lõng', icon: Frown, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { id: 'stressed', label: 'Áp lực & Quá tải', icon: Coffee, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { id: 'peaceful', label: 'Bình yên & Thư thái', icon: Sun, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { id: 'energized', label: 'Tràn đầy năng lượng', icon: Sparkles, color: 'text-teal-500 bg-teal-50 border-teal-200' },
];

export const FreshmanCorner: React.FC<Props> = ({ onStartCompanionChat }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<FreshmanGuideArticle | null>(FRESHMAN_ARTICLES[0]);
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>(() => {
    const saved = localStorage.getItem('unibuddy_freshman_checklist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'chk-1', text: 'Giấy tờ tùy thân: CCCD gắn chip (gốc + 3 bản công chứng)', done: true },
      { id: 'chk-2', text: 'Giấy báo trúng tuyển & Hồ sơ học sinh sinh viên', done: true },
      { id: 'chk-3', text: 'Đăng ký tạm trú tại Công an phường / ban quản lý KTX', done: false },
      { id: 'chk-4', text: 'Làm thẻ ngân hàng liên kết tài khoản sinh viên', done: true },
      { id: 'chk-5', text: 'Mua thẻ xe buýt tháng liên tuyến (100k/tháng)', done: false },
      { id: 'chk-6', text: 'Đồ dùng phòng trọ: Quạt, ổ cắm điện nhiều lỗ, bình đun siêu tốc', done: true },
      { id: 'chk-7', text: 'Đọc Sổ tay sinh viên và Quy chế đào tạo tín chỉ của trường', done: false },
    ];
  });
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const saveChecklist = (next: { id: string; text: string; done: boolean }[]) => {
    setChecklist(next);
    localStorage.setItem('unibuddy_freshman_checklist', JSON.stringify(next));
  };

  const toggleChecklist = (id: string) => {
    if (editingId === id) return;
    saveChecklist(checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChecklistInput.trim();
    if (!trimmed) return;
    saveChecklist([...checklist, { id: `chk-${Date.now()}`, text: trimmed, done: false }]);
    setNewChecklistInput('');
  };

  const handleStartEdit = (e: React.MouseEvent, item: { id: string; text: string }) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      saveChecklist(checklist.map((item) => (item.id === editingId ? { ...item, text: trimmed } : item)));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteChecklistItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveChecklist(checklist.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingText('');
    }
  };

  const getMoodComfortMessage = (moodId: string) => {
    switch (moodId) {
      case 'homesick':
        return '💙 Cảm giác nhớ nhà là hoàn toàn tự nhiên khi lần đầu xa gia đình. Hãy gọi cho mẹ 5 phút hoặc tự thưởng một món ăn quê hương nhé. Bạn luôn có UniBuddy lắng nghe!';
      case 'stressed':
        return '🌿 Hít một hơi thật sâu. Không ai có thể làm hoàn hảo tất cả mọi thứ ngay tuần đầu tiên. Hãy chia nhỏ bài tập và nghỉ ngơi 15 phút nhé!';
      case 'happy':
        return '✨ Tuyệt vời! Giữ nguồn năng lượng tích cực này để khám phá trường lớp và kết nối thêm những người bạn mới nhé!';
      case 'peaceful':
        return '☕ Một ngày bình yên là cơ hội tuyệt vời để nhâm nhi một tách trà, đọc vài trang sách và lên kế hoạch cho tuần tới.';
      case 'energized':
        return '🔥 Năng lượng dồi dào! Đây là thời điểm lý tưởng để hoàn thành các deadline tồn đọng hoặc tìm hiểu các Câu lạc bộ học thuật!';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mood Tracker & Emotional Empathy Header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-rose-100" />
              Cẩm Nang Sinh Viên & Sức Khỏe Tinh Thần
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Hôm nay bạn đang cảm thấy thế nào?
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-xl">
            Đến một môi trường mới với thành phố đông đúc và cách học đại học xa lạ không hề dễ dàng.
            Hãy chia sẻ cảm xúc thật của bạn nhé!
          </p>

          {/* Mood Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-white text-rose-700 shadow-md scale-105'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Instant Comfort Response */}
          {selectedMood && (
            <div className="mt-4 p-3.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-white animate-fadeIn">
              <p className="leading-relaxed font-medium">
                {getMoodComfortMessage(selectedMood)}
              </p>
              <button
                onClick={() =>
                  onStartCompanionChat(
                    selectedMood === 'homesick'
                      ? 'Mình là tân sinh viên xa nhà, hôm nay mình cảm thấy rất nhớ gia đình và hơi lạc lõng ở thành phố mới...'
                      : selectedMood === 'stressed'
                      ? 'Mình đang cảm thấy bị ngợp và áp lực với khối lượng bài tập và cách học đại học...'
                      : 'Hôm nay mình muốn tâm sự cùng bạn một chút về cuộc sống sinh viên...'
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl font-bold shrink-0 transition shadow-sm text-xs"
              >
                <MessageCircleHeart className="w-4 h-4 text-rose-600" />
                Tâm sự với Bạn Cùng Phòng Ảo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Freshman Survival Handbook & Actionable Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Articles Section (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Cẩm Nang Sinh Viên Toàn Diện
            </h3>
            <span className="text-xs text-slate-400">Kinh nghiệm từ các anh chị khóa trên</span>
          </div>

          {/* Article tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FRESHMAN_ARTICLES.map((art) => {
              const isSelected = activeArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => setActiveArticle(art)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 mb-1">
                      <span className="uppercase">{art.category === 'safety' ? 'An toàn' : art.category === 'psychology' ? 'Tâm lý' : art.category === 'finance' ? 'Tài chính' : 'Học tập'}</span>
                      <span className="text-slate-400 font-normal">{art.readTime}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug">{art.title}</h4>
                    <p className="text-slate-500 line-clamp-2 mt-1 text-[11px] leading-relaxed">{art.summary}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center text-indigo-600 font-bold text-[11px] gap-1">
                    <span>Đọc chi tiết</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Article Full View */}
          {activeArticle && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Chuyên đề kinh nghiệm
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                  {activeArticle.title}
                </h3>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeArticle.content.map((p, idx) => (
                  <p key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {p}
                  </p>
                ))}
              </div>

              <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs">
                <h5 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Lời khuyên thiết thực dành riêng cho bạn:
                </h5>
                <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                  {activeArticle.tips.map((t, tIdx) => (
                    <li key={tIdx} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Study & Student Checklist Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Checklist Hành Trang Học Tập
            </h3>
            <span className="text-xs text-slate-400">
              {checklist.filter((i) => i.done).length}/{checklist.length} đã xong
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            {/* Add new checklist item */}
            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pb-1">
              <input
                type="text"
                placeholder="Thêm mục hành trang của riêng bạn..."
                value={newChecklistInput}
                onChange={(e) => setNewChecklistInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </form>

            {checklist.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Checklist đang trống. Hãy thêm mục mới ở trên!
              </p>
            ) : (
              checklist.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`group p-2.5 rounded-xl border transition flex items-start justify-between gap-2 text-xs ${
                      isEditing
                        ? 'bg-white border-emerald-400 ring-1 ring-emerald-200'
                        : item.done
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-500 cursor-pointer'
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleSaveEdit}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-500 text-slate-900"
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Lưu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
                          />
                          <span className={`leading-snug break-words ${item.done ? 'line-through text-slate-400' : 'font-medium'}`}>
                            {item.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(e, item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChecklistItem(e, item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mt-3">
              💡 <strong>Mẹo nhỏ:</strong> Lưu ảnh chụp mặt trước/sau CCCD và Thẻ sinh viên vào một album riêng trên điện thoại để xuất trình khi cần thiết nhé!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
