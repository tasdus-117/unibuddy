import React, { useState, useRef } from 'react';
import { ScheduleItem, DayOfWeek } from '../types';
import { getDayLabel } from '../utils/academicUtils';
import {
  Upload,
  Link2,
  FileText,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSchedule: (items: ScheduleItem[], mode: 'replace' | 'merge') => void;
}

export const AutoScheduleImporter: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportSchedule,
}) => {
  const [tab, setTab] = useState<'image' | 'link' | 'text'>('image');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<ScheduleItem[] | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn một tệp hình ảnh (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setErrorMsg(null);
    setImageMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageMime(file.type);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = (sampleType: 'image' | 'link' | 'text') => {
    setErrorMsg(null);
    setPreviewItems(null);
    if (sampleType === 'link') {
      setTab('link');
      setUrlInput('https://online.hvnh.edu.vn/tkb-sinh-vien-hoc-ky-2');
    } else if (sampleType === 'text') {
      setTab('text');
      setTextInput(`1. Kinh tế Vi mô - ECO101 - Thứ 2 - Ca 1 (07:00 - 09:30) - Phòng D.302 - TS. Hoàng Minh Đức
2. Triết học Mác-Lênin - PHI102 - Thứ 2 - Ca 3 (13:00 - 15:30) - Phòng A.105 - ThS. Nguyễn Thị Lan
3. Toán Cao cấp - MAT101 - Thứ 3 - Ca 2 (09:45 - 12:15) - Phòng B.204 - PGS. TS. Trần Văn An
4. Tiếng Anh 1 - ENG101 - Thứ 4 - Ca 1 (07:00 - 09:30) - Lab Ngoại ngữ - ThS. Lê Mai Phương
5. Tin học ĐC - INF101 - Thứ 6 - Ca 2 (09:45 - 12:15) - Lab 3 CNTT - ThS. Bùi Tuấn Anh`);
    } else {
      // Mock visual sample for test
      setTab('image');
      // Create a nice canvas with timetable table for image sample
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('THỜI KHÓA BIỂU HỌC KỲ - HỌC VIỆN NGÂN HÀNG', 40, 45);

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('Thứ 2 | 07:00 - 09:30 | Kinh tế Vi mô (ECO101) | Phòng D.302', 40, 95);
        ctx.fillText('Thứ 2 | 13:00 - 15:30 | Triết học Mác-Lênin (PHI102) | Hội trường A', 40, 135);
        ctx.fillText('Thứ 3 | 09:45 - 12:15 | Toán Cao cấp (MAT101) | Phòng B.204', 40, 175);
        ctx.fillText('Thứ 4 | 07:00 - 09:30 | Tiếng Anh Học thuật (ENG101) | Lab Ngoại ngữ', 40, 215);
        ctx.fillText('Thứ 5 | 13:00 - 15:30 | Pháp luật Đại cương (LAW100) | Giảng đường D', 40, 255);
        ctx.fillText('Thứ 6 | 09:45 - 12:15 | Tin học Đại cương (INF101) | Lab 3 CNTT', 40, 295);

        const dataUrl = canvas.toDataURL('image/png');
        setImagePreview(dataUrl);
        setImageBase64(dataUrl);
        setImageMime('image/png');
      }
    }
  };

  const handleStartParsing = async () => {
    setErrorMsg(null);
    setPreviewItems(null);

    if (tab === 'image' && !imageBase64) {
      setErrorMsg('Vui lòng tải lên hoặc kéo thả ảnh chụp thời khóa biểu.');
      return;
    }
    if (tab === 'link' && !urlInput.trim()) {
      setErrorMsg('Vui lòng dán đường link trang web thời khóa biểu.');
      return;
    }
    if (tab === 'text' && !textInput.trim()) {
      setErrorMsg('Vui lòng nhập danh sách môn học hoặc copy từ cổng thông tin sinh viên.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {};
      if (tab === 'image') {
        payload.imageBase64 = imageBase64;
        payload.mimeType = imageMime;
      } else if (tab === 'link') {
        payload.url = urlInput.trim();
      } else {
        payload.rawText = textInput.trim();
      }

      const res = await fetch('/api/schedule/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể trích xuất thời khóa biểu.');
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        // Standardize items with IDs and colors
        const colors = ['emerald', 'blue', 'indigo', 'purple', 'rose', 'amber'];
        const formatted: ScheduleItem[] = data.items.map((it: any, index: number) => {
          const dayCode = (['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].includes(it.dayOfWeek)
            ? it.dayOfWeek
            : 'T2') as DayOfWeek;

          return {
            id: `sch-ai-${Date.now()}-${index}`,
            subjectName: it.subjectName || 'Môn học mới',
            subjectCode: it.subjectCode || 'HP' + (index + 1),
            dayOfWeek: dayCode,
            shift: it.shift || `${it.startTime || '07:00'} - ${it.endTime || '09:30'}`,
            startTime: it.startTime || '07:00',
            endTime: it.endTime || '09:30',
            room: it.room || 'Giảng đường',
            lecturer: it.lecturer || '',
            credits: Number(it.credits) || 3,
            type: it.type || 'lecture',
            notes: it.notes || 'Nhập tự động qua AI',
            color: colors[index % colors.length],
          };
        });

        setPreviewItems(formatted);
      } else {
        throw new Error('Không tìm thấy thông tin ca học nào trong dữ liệu cung cấp.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi khi quét thời khóa biểu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!previewItems || previewItems.length === 0) return;
    onImportSchedule(previewItems, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Trích Xuất Tự Động
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Tự Động Thiết Lập Thời Khóa Biểu Từ Ảnh / Đường Link
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-xl">
            Tải ảnh chụp màn hình TKB trường ĐH (HVNH, NEU, HUST, FTU, UEH...) hoặc dán đường link/văn bản. AI sẽ tự động đọc ca học, phòng học, thứ trong tuần và thêm ngay vào lịch biểu!
          </p>

          {/* Quick sample chips */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/15 text-xs">
            <span className="text-white/75 text-[11px]">Thử nhanh dữ liệu mẫu:</span>
            <button
              onClick={() => handleLoadSample('image')}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-medium transition"
            >
              📷 Ảnh chụp mẫu
            </button>
            <button
              onClick={() => handleLoadSample('text')}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-medium transition"
            >
              📝 Văn bản mẫu
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Method selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => {
                setTab('image');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                tab === 'image'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Ảnh Chụp TKB</span>
            </button>

            <button
              onClick={() => {
                setTab('link');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                tab === 'link'
                  ? 'bg-white text-indigo-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>Đường Link Web</span>
            </button>

            <button
              onClick={() => {
                setTab('text');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                tab === 'text'
                  ? 'bg-white text-teal-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Dán Văn Bản</span>
            </button>
          </div>

          {/* Tab 1: Image Upload */}
          {tab === 'image' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="tkb-file-upload"
              />

              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Bấm để tải ảnh lên hoặc kéo thả ảnh vào đây
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Hỗ trợ ảnh chụp màn hình từ cổng sinh viên (portal đăng ký tín chỉ), phiếu báo thời khóa biểu, bảng biểu Excel...
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200 mt-1">
                    Chọn tệp ảnh (PNG, JPG, JPEG)
                  </span>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
                  <img
                    src={imagePreview}
                    alt="Thời khóa biểu tải lên"
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button
                      onClick={handleClearImage}
                      className="px-2.5 py-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-800/90 text-white text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <ImageIcon className="w-3.5 h-3.5" /> Ảnh đã sẵn sàng để quét
                    </span>
                    <span className="text-[11px] text-slate-400">AI Gemini Vision</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: URL Input */}
          {tab === 'link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đường dẫn (URL) trang tra cứu thời khóa biểu của trường
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://daotao.hvnh.edu.vn/thoikhoabieu hoặc link portal sinh viên..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                💡 <strong>Mẹo:</strong> Nếu trang web trường của bạn yêu cầu mật khẩu đăng nhập, bạn chỉ cần chụp ảnh màn hình thời khóa biểu rồi chọn tab <strong>"Ảnh Chụp TKB"</strong> hoặc sao chép nội dung bảng vào tab <strong>"Dán Văn Bản"</strong> nhé!
              </p>
            </div>
          )}

          {/* Tab 3: Text Input */}
          {tab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dán nội dung thời khóa biểu dạng văn bản hoặc bảng tính
                </label>
                <textarea
                  rows={6}
                  placeholder={`Dán danh sách môn học, ví dụ:\nKinh tế Vi mô | ECO101 | Thứ 2 | Ca 1 | D.302\nToán Cao cấp | MAT101 | Thứ 3 | Ca 2 | B.204...`}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-teal-500 transition"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                AI sẽ tự động nhận diện tên môn, mã học phần, thứ trong tuần, ca học và phòng học.
              </p>
            </div>
          )}

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Lưu ý:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Parse Action Button */}
          {!previewItems && (
            <div className="pt-2">
              <button
                onClick={handleStartParsing}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích và trích xuất lịch học...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Bắt Đầu Tự Động Trích Xuất Lịch Trình</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview Results Table */}
          {previewItems && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-300">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã trích xuất thành công {previewItems.length} ca học!</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 text-[11px]">Chế độ nhập:</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-900"
                  >
                    <option value="merge">Thêm vào TKB hiện tại</option>
                    <option value="replace">Thay thế toàn bộ TKB</option>
                  </select>
                </div>
              </div>

              {/* List of extracted classes */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {previewItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.subjectName}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                          {item.subjectCode}
                        </span>
                        <span className="text-slate-400 text-[10px]">{item.credits} tín</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-semibold text-emerald-700">{getDayLabel(item.dayOfWeek)}</span>
                        <span>•</span>
                        <span>{item.shift} ({item.startTime} - {item.endTime})</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">Phòng: {item.room}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPreviewItems(previewItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Xóa môn này khỏi danh sách nhập"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Confirmation Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewItems(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Quét Lại
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận & Thiết Lập Vào TKB ({previewItems.length} ca)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
