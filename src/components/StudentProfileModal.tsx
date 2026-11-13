import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import {
  X,
  User,
  GraduationCap,
  Building2,
  BookOpen,
  Mail,
  Phone,
  Target,
  Pencil,
  Check,
  Award,
  Clock,
  IdCard,
  Sparkles,
  Camera,
  Trash2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (updated: StudentProfile) => void;
  currentGpa: number;
  totalCredits: number;
  pendingDeadlinesCount: number;
  isFirstTimeSetup: boolean;
}

const UNIVERSITY_OPTIONS = [
  'Học viện Ngân hàng (HVNH)',
  'Trường ĐH Kinh tế Quốc dân (NEU)',
  'Trường ĐH Ngoại thương (FTU)',
  'Đại học Bách khoa Hà Nội (HUST)',
  'ĐH Kinh tế TP.HCM (UEH)',
  'Đại học Quốc gia Hà Nội (VNU)',
  'Đại học Quốc gia TP.HCM',
  'Trường ĐH FPT',
  'Khác',
];

const ACADEMIC_YEAR_OPTIONS = [
  'Năm 1 (Tân sinh viên)',
  'Năm 2',
  'Năm 3',
  'Năm 4',
  'Năm cuối / Thực tập',
];

const THEME_GRADIENTS: Record<StudentProfile['themeColor'], string> = {
  emerald: 'from-emerald-600 via-teal-600 to-cyan-600',
  indigo: 'from-indigo-600 via-blue-600 to-violet-600',
  teal: 'from-teal-600 via-emerald-500 to-sky-600',
  rose: 'from-rose-500 via-pink-600 to-indigo-600',
  amber: 'from-amber-500 via-orange-500 to-rose-500',
};

const THEME_LABELS: { id: StudentProfile['themeColor']; label: string; dot: string }[] = [
  { id: 'emerald', label: 'Xanh lá', dot: 'bg-emerald-500' },
  { id: 'indigo', label: 'Xanh dương', dot: 'bg-indigo-500' },
  { id: 'teal', label: 'Ngọc lam', dot: 'bg-teal-500' },
  { id: 'rose', label: 'Hồng phấn', dot: 'bg-rose-500' },
  { id: 'amber', label: 'Vàng cam', dot: 'bg-amber-500' },
];

export const StudentProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  currentGpa,
  totalCredits,
  pendingDeadlinesCount,
  isFirstTimeSetup,
}) => {
  const [isEditing, setIsEditing] = useState(isFirstTimeSetup);
  const [draft, setDraft] = useState<StudentProfile>(profile);
  const [customUniversity, setCustomUniversity] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const wasOpenRef = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (isFirstTimeSetup) {
        setDraft({
          ...profile,
          fullName: '',
          studentId: '',
          major: '',
          email: '',
          phone: '',
          bio: '',
          avatarUrl: undefined,
        });
        setIsEditing(true);
      } else {
        setDraft(profile);
        setIsEditing(false);
      }
      setSavedNotice(false);
      setAvatarError(null);
      const isPreset = UNIVERSITY_OPTIONS.slice(0, -1).includes(profile.university);
      setCustomUniversity(isPreset ? '' : profile.university);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, profile, isFirstTimeSetup]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarError('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP...).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 256;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setDraft((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));
      };
      img.onerror = () => {
        setAvatarError('Không thể đọc ảnh này. Vui lòng thử ảnh khác.');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedUniversityOption = UNIVERSITY_OPTIONS.slice(0, -1).includes(draft.university)
    ? draft.university
    : 'Khác';

  const handleUniversitySelectChange = (value: string) => {
    if (value === 'Khác') {
      setDraft({ ...draft, university: customUniversity || 'Trường Đại học của bạn' });
    } else {
      setCustomUniversity('');
      setDraft({ ...draft, university: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: StudentProfile = {
      ...draft,
      fullName: draft.fullName.trim() || 'Sinh Viên UniBuddy',
      studentId: draft.studentId.trim() || 'SV2026',
      university:
        selectedUniversityOption === 'Khác'
          ? customUniversity.trim() || 'Trường Đại học tại Việt Nam'
          : draft.university,
      major: draft.major.trim() || 'Chưa cập nhật ngành',
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      targetGpa: Math.min(4.0, Math.max(0, Number(draft.targetGpa) || 3.2)),
      bio: draft.bio.trim(),
    };
    onSaveProfile(cleaned);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const initials = (profile.fullName || 'SV')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const gpaProgress = profile.targetGpa > 0 ? Math.min(100, Math.round((currentGpa / profile.targetGpa) * 100)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div
          className={`bg-gradient-to-r ${THEME_GRADIENTS[isEditing ? draft.themeColor : profile.themeColor]} p-5 sm:p-6 text-white relative`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
            title="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-extrabold shadow-inner shrink-0 overflow-hidden relative">
              {(isEditing ? draft.avatarUrl : profile.avatarUrl) ? (
                <img
                  src={isEditing ? draft.avatarUrl : profile.avatarUrl}
                  alt={profile.fullName || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : isFirstTimeSetup ? (
                <GraduationCap className="w-8 h-8" />
              ) : (
                initials || <GraduationCap className="w-8 h-8" />
              )}
            </div>
            <div className="min-w-0 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                  {isFirstTimeSetup ? 'Thiết lập lần đầu' : 'Thẻ Sinh Viên UniBuddy'}
                </span>
                {!isFirstTimeSetup && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/15">
                    {profile.academicYear}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold truncate mt-1">
                {isFirstTimeSetup ? 'Thiết lập hồ sơ của riêng bạn' : profile.fullName}
              </h2>
              <p className="text-xs text-white/90 truncate flex items-center gap-1.5 mt-0.5">
                <IdCard className="w-3.5 h-3.5 shrink-0" />
                {isFirstTimeSetup
                  ? 'Điền thông tin sinh viên để cá nhân hóa trải nghiệm UniBuddy VN'
                  : `MSSV: ${profile.studentId || 'Chưa cập nhật'} • ${profile.university}`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {savedNotice && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              Đã lưu thay đổi hồ sơ sinh viên của bạn!
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-5">
              {/* Quick Academic Overview */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Award className="w-3.5 h-3.5" /> GPA Hiện Tại
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-900 mt-0.5">
                    {currentGpa.toFixed(2)}
                    <span className="text-xs font-normal text-emerald-600"> / 4.0</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-700">
                    <BookOpen className="w-3.5 h-3.5" /> Tín Chỉ Kỳ Này
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-indigo-900 mt-0.5">
                    {totalCredits}
                    <span className="text-xs font-normal text-indigo-600"> tín</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-700">
                    <Clock className="w-3.5 h-3.5" /> Deadline Chờ
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-900 mt-0.5">
                    {pendingDeadlinesCount}
                    <span className="text-xs font-normal text-amber-600"> việc</span>
                  </div>
                </div>
              </div>

              {/* Target GPA Progress */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Mục tiêu GPA học kỳ
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {currentGpa.toFixed(2)} / {profile.targetGpa.toFixed(2)} ({gpaProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                    style={{ width: `${gpaProgress}%` }}
                  />
                </div>
              </div>

              {/* Detailed Info List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <Building2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 font-medium">Trường đại học / Học viện</div>
                    <div className="font-bold text-slate-800 mt-0.5">{profile.university}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <GraduationCap className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 font-medium">Chuyên ngành & Khóa học</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {profile.major} • {profile.academicYear}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <Mail className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-slate-400 font-medium">Email</div>
                      <div className="font-semibold text-slate-800 mt-0.5 truncate">
                        {profile.email || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <Phone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-slate-400 font-medium">Số điện thoại</div>
                      <div className="font-semibold text-slate-800 mt-0.5 truncate">
                        {profile.phone || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="text-emerald-800 font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Mục tiêu & Ghi chú bản thân
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {profile.bio || 'Chưa có ghi chú mục tiêu. Hãy nhấn chỉnh sửa để thêm động lực học tập cho riêng bạn!'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  {isFirstTimeSetup ? 'Thiết lập thông tin của riêng bạn' : 'Cập nhật thông tin hồ sơ'}
                </h3>
              </div>

              {/* Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold overflow-hidden shrink-0">
                    {draft.avatarUrl ? (
                      <img
                        src={draft.avatarUrl}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Ảnh đại diện</div>
                    <p className="text-[11px] text-slate-500">
                      Tải ảnh cá nhân hoặc ảnh yêu thích của bạn lên thẻ UniBuddy
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 text-slate-700 font-semibold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {draft.avatarUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                  </button>
                  {draft.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, avatarUrl: undefined }))}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-400 transition"
                      title="Xóa ảnh đại diện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {avatarError && (
                <p className="text-[11px] text-rose-600 font-medium">{avatarError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên hiển thị / Biệt danh *
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.fullName}
                    onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                    placeholder="VD: Minh Anh, Mèo Mướp, Cá Bơi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Có thể dùng tên thật, biệt danh hoặc tên bạn thích
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã số sinh viên (MSSV)</label>
                  <input
                    type="text"
                    value={draft.studentId}
                    onChange={(e) => setDraft({ ...draft, studentId: e.target.value })}
                    placeholder="VD: 25A4041234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trường đại học / Học viện</label>
                <select
                  value={selectedUniversityOption}
                  onChange={(e) => handleUniversitySelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                >
                  {UNIVERSITY_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {selectedUniversityOption === 'Khác' && (
                  <input
                    type="text"
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    placeholder="Nhập tên trường đại học của bạn..."
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chuyên ngành</label>
                  <input
                    type="text"
                    value={draft.major}
                    onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                    placeholder="VD: Tài chính - Ngân hàng"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Năm học</label>
                  <select
                    value={draft.academicYear}
                    onChange={(e) => setDraft({ ...draft, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  >
                    {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="sinhvien@edu.vn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mục tiêu GPA (Hệ 4)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="4"
                    value={draft.targetGpa}
                    onChange={(e) => setDraft({ ...draft, targetGpa: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục tiêu & Ghi chú cá nhân</label>
                <textarea
                  rows={2}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  placeholder="Chia sẻ mục tiêu học kỳ hoặc câu châm ngôn của bạn..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 font-medium text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Màu thẻ sinh viên</label>
                <div className="flex flex-wrap gap-2">
                  {THEME_LABELS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, themeColor: t.id })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
                        draft.themeColor === t.id
                          ? 'border-slate-800 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (isFirstTimeSetup) {
                      onClose();
                    } else {
                      setDraft(profile);
                      setIsEditing(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {isFirstTimeSetup ? 'Để sau' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isFirstTimeSetup ? 'Hoàn tất thiết lập' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
