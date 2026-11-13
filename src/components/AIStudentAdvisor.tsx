import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QAMode } from '../types';
import { QUICK_QA_QUESTIONS, UNIVERSITIES_DATA } from '../data/sampleData';
import {
  Send,
  Sparkles,
  GraduationCap,
  Building2,
  HeartHandshake,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  BookOpen,
  User,
  Bot,
  Compass,
  ArrowRight,
  Globe,
  Mic,
  Zap,
  BrainCircuit,
  ExternalLink
} from 'lucide-react';
import { LiveVoiceModal } from './LiveVoiceModal';

interface AdvisorProps {
  studentUniversity?: string;
  studentMajor?: string;
}

export const AIStudentAdvisor: React.FC<AdvisorProps> = ({
  studentUniversity,
  studentMajor,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('unibuddy_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `👋 **Chào bạn, mình là UniBuddy VN!**\n\nMình là trợ lý thông minh và người bạn đồng hành luôn sát cánh bên sinh viên và tân sinh viên tại Việt Nam.\n\nBạn có thể hỏi mình bất kỳ điều gì:\n- 🎓 **Học vụ & Tín chỉ:** Quy chế điểm số, học phần tiên quyết, nợ môn, cảnh báo học vụ, cách đăng ký tín chỉ.\n- 🏛️ **Thông tin trường ĐH:** Tuyển sinh, học phí, học bổng, KTX, đời sống sinh viên các trường như **Học viện Ngân hàng (HVNH)**, **NEU**, **FTU**, **HUST**, **UEH**, **ĐHQG**...\n- ❤️ **Góc Tâm Sự & Đồng Cảm:** Bạn đang cảm thấy nhớ nhà, bỡ ngỡ ở thành phố mới, áp lực đồng trang lứa hay mâu thuẫn phòng trọ? Hãy tâm sự cùng mình, mình luôn ở đây lắng nghe và chia sẻ.\n- 💡 **Phương pháp học:** Lập kế hoạch ôn thi, phương pháp Feynman, Pomodoro, bí kíp vượt qua các môn đại cương.\n\n*Hôm nay bạn đang có khúc mắc hay tâm sự gì muốn chia sẻ cùng mình không?*`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mode: 'academic',
        suggestions: [
          'Bị điểm F môn tiên quyết thì kỳ sau thế nào?',
          'Kinh nghiệm săn học bổng khuyến khích học tập?',
          'Lần đầu xa nhà thấy cô đơn và nhớ gia đình...',
          'Cho mình biết thông tin về Học viện Ngân hàng (HVNH)',
        ],
      },
    ];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const [selectedMode, setSelectedMode] = useState<QAMode>('academic');
  const [selectedUniversity, setSelectedUniversity] = useState(
    studentUniversity || 'Học viện Ngân hàng (HVNH)'
  );
  const [customMajor, setCustomMajor] = useState(
    studentMajor || 'Tài chính - Ngân hàng / Kinh tế'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [speedMode, setSpeedMode] = useState<'fast' | 'balanced' | 'deep'>('balanced');
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (studentUniversity) setSelectedUniversity(studentUniversity);
  }, [studentUniversity]);

  useEffect(() => {
    if (studentMajor) setCustomMajor(studentMajor);
  }, [studentMajor]);

  useEffect(() => {
    localStorage.setItem('unibuddy_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (questionText?: string) => {
    const query = (questionText || inputQuestion).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      mode: selectedMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      // Build multi-turn history
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/student-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          mode: selectedMode,
          university: selectedUniversity,
          major: customMajor,
          history: historyPayload,
          useSearch,
          speedMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi kết nối máy chủ.');
      }

      const botReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Mình đã nhận được câu hỏi, nhưng hiện tại hệ thống đang phản hồi chậm. Bạn thử hỏi lại nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mode: selectedMode,
        suggestions: generateFollowUps(selectedMode),
        sources: Array.isArray(data.sources) ? data.sources : [],
        modelLabel: data.modelUsed,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Không thể trả lời:** ${err?.message || 'Có lỗi khi trò chuyện. Vui lòng thử lại.'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mode: selectedMode,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFollowUps = (mode: QAMode): string[] => {
    switch (mode) {
      case 'academic':
        return [
          'Cách đăng ký tín chỉ không bị nghẽn mạng?',
          'Làm sao để đạt Điểm rèn luyện loại Xuất sắc (>90đ)?',
          'Thủ tục làm giấy hoãn nghĩa vụ quân sự thế nào?',
        ];
      case 'university_info':
        return [
          'Học phí tín chỉ của trường năm nay khoảng bao nhiêu?',
          'Ký túc xá của trường có điều hòa và ưu tiên ai?',
          'Các Câu lạc bộ nổi bật nhất để tân sinh viên tham gia?',
        ];
      case 'freshman_empathy':
        return [
          'Làm thế nào để bắt chuyện làm quen với bạn cùng lớp?',
          'Cách đối phó với mâu thuẫn giờ giấc với bạn cùng phòng trọ?',
          'Mình thấy kiệt sức vì nhiều bài tập quá, phải làm sao?',
        ];
      case 'study_method':
        return [
          'Lập thời gian biểu ôn thi 14 ngày cho môn này?',
          'Cách áp dụng phương pháp Feynman để nhớ lâu?',
          'Mẹo ôn thi trắc nghiệm không bị bẫy đề thi?',
        ];
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử trò chuyện này?')) {
      localStorage.removeItem('unibuddy_chat_history');
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Cuộc trò chuyện đã được làm mới! Mình có thể hỗ trợ gì cho bạn hôm nay?',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          mode: selectedMode,
        },
      ]);
    }
  };

  // Filter suggested questions matching current mode
  const currentModeQuestions = QUICK_QA_QUESTIONS.filter((q) => q.mode === selectedMode);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Mode Switcher */}
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">AI Cố Vấn & Bạn Đồng Hành Sinh Viên</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Giải đáp học vụ đa lượt, tìm kiếm web Google Search & đàm thoại giọng nói trực tiếp
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsLiveVoiceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition"
              title="Mở cuộc gọi giọng nói trực tiếp với AI"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Đàm thoại Live</span>
            </button>

            {/* University context dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <select
                aria-label="Chọn trường đại học để AI tư vấn chuẩn xác nhất"
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
              >
                {![
                  'Học viện Ngân hàng (HVNH)',
                  'Trường ĐH Kinh tế Quốc dân (NEU)',
                  'Trường ĐH Ngoại thương (FTU)',
                  'Đại học Bách khoa Hà Nội (HUST)',
                  'ĐH Kinh tế TP.HCM (UEH)',
                  'Đại học Quốc gia Hà Nội (VNU)',
                  'Đại học Quốc gia TP.HCM',
                  'Các trường Đại học tại Việt Nam',
                ].includes(selectedUniversity) && (
                  <option value={selectedUniversity}>{selectedUniversity}</option>
                )}
                <option value="Học viện Ngân hàng (HVNH)">Học viện Ngân hàng (HVNH)</option>
                <option value="Trường ĐH Kinh tế Quốc dân (NEU)">ĐH Kinh tế Quốc dân (NEU)</option>
                <option value="Trường ĐH Ngoại thương (FTU)">ĐH Ngoại thương (FTU)</option>
                <option value="Đại học Bách khoa Hà Nội (HUST)">ĐH Bách Khoa (HUST)</option>
                <option value="ĐH Kinh tế TP.HCM (UEH)">ĐH Kinh tế TP.HCM (UEH)</option>
                <option value="Đại học Quốc gia Hà Nội (VNU)">ĐHQG Hà Nội (VNU)</option>
                <option value="Đại học Quốc gia TP.HCM">ĐHQG TP.HCM</option>
                <option value="Các trường Đại học tại Việt Nam">Khác / Toàn quốc</option>
              </select>
            </div>

            <button
              onClick={clearChat}
              title="Làm mới cuộc trò chuyện"
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Specialized Modes Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => setSelectedMode('academic')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              selectedMode === 'academic'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Học Vụ & Tín Chỉ</span>
          </button>

          <button
            onClick={() => setSelectedMode('university_info')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              selectedMode === 'university_info'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Thông Tin Trường ĐH</span>
          </button>

          <button
            onClick={() => setSelectedMode('freshman_empathy')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              selectedMode === 'freshman_empathy'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Tâm Sự & Đồng Cảm</span>
          </button>

          <button
            onClick={() => setSelectedMode('study_method')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              selectedMode === 'study_method'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Phương Pháp Ôn Thi</span>
          </button>
        </div>

        {/* Google Search Grounding & Model Speed/Thinking Controls */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setUseSearch((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border transition ${
              useSearch
                ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="Tra cứu dữ liệu mới nhất trên web thông qua Google Search Grounding"
          >
            <Globe className={`w-3.5 h-3.5 ${useSearch ? 'text-sky-600' : 'text-slate-400'}`} />
            <span>Google Search Web: {useSearch ? 'Bật' : 'Tắt'}</span>
          </button>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <span className="text-slate-400 font-medium px-1.5 hidden sm:inline">Chế độ:</span>
            <button
              type="button"
              onClick={() => setSpeedMode('fast')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition ${
                speedMode === 'fast'
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Phản hồi siêu tốc"
            >
              <Zap className="w-3 h-3" />
              <span>Nhanh</span>
            </button>
            <button
              type="button"
              onClick={() => setSpeedMode('balanced')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition ${
                speedMode === 'balanced'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Cân bằng tốc độ và độ sâu"
            >
              <Sparkles className="w-3 h-3" />
              <span>Cân bằng</span>
            </button>
            <button
              type="button"
              onClick={() => setSpeedMode('deep')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition ${
                speedMode === 'deep'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Suy luận chuyên sâu cho bài toán học vụ phức tạp"
            >
              <BrainCircuit className="w-3 h-3" />
              <span>Chuyên sâu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-xs ${
                msg.role === 'user'
                  ? 'bg-slate-800'
                  : msg.mode === 'freshman_empathy'
                  ? 'bg-rose-500'
                  : msg.mode === 'university_info'
                  ? 'bg-indigo-600'
                  : msg.mode === 'study_method'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs'
              }`}
            >
              {/* Header inside assistant message */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 text-[11px] text-slate-500">
                  <span className="font-semibold flex items-center gap-1 text-slate-700">
                    {msg.mode === 'freshman_empathy' ? (
                      <>
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                        Bạn Cùng Phòng Ảo (Đồng cảm)
                      </>
                    ) : msg.mode === 'university_info' ? (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        Thông tin ĐH Việt Nam ({selectedUniversity.split('(')[1]?.replace(')', '') || 'VN'})
                      </>
                    ) : msg.mode === 'study_method' ? (
                      <>
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Cố Vấn Ôn Thi & Kế Hoạch
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        Cố Vấn Học Vụ & Tín Chỉ
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.modelLabel && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] font-medium text-slate-600">
                        {msg.modelLabel === 'fallback' ? 'Trả lời dự phòng' :
                          msg.modelLabel === 'gemini-3.1-flash-lite' ? 'Flash Lite' : 'Gemini 4'}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      title="Sao chép nội dung"
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Render content with formatted markdown paragraphs */}
              <div className="space-y-2 whitespace-pre-wrap">
                {msg.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {paragraph.split('\n').map((line, lineIdx) => {
                      // Simple bold renderer
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <span key={lineIdx} className="block">
                          {parts.map((p, pIdx) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                              return <strong key={pIdx} className="font-bold">{p.slice(2, -2)}</strong>;
                            }
                            if (p.startsWith('*') && p.endsWith('*')) {
                              return <em key={pIdx} className="italic text-slate-500">{p.slice(1, -1)}</em>;
                            }
                            return p;
                          })}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>

              {/* Google Search Grounding Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                  <div className="text-[11px] font-semibold text-sky-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-600" /> Nguồn tham khảo từ Google Search:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, srcIdx) => (
                      <a
                        key={srcIdx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg transition font-medium max-w-[260px]"
                        title={src.uri}
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-sky-600" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-teal-600" /> Gợi ý câu hỏi tiếp theo:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-left transition font-medium flex items-center gap-1"
                      >
                        <span>{sug}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 rounded-tl-xs max-w-sm">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>UniBuddy đang tra cứu và suy nghĩ phản hồi...</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar based on current mode */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" /> Hỏi nhanh:
        </span>
        {currentModeQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.question)}
            className="text-[11px] px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg shrink-0 transition"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={
                selectedMode === 'freshman_empathy'
                  ? 'Hãy chia sẻ cảm xúc, nỗi nhớ nhà hay áp lực của bạn...'
                  : selectedMode === 'university_info'
                  ? `Hỏi về tuyển sinh, KTX, học phí, câu lạc bộ tại ${selectedUniversity.split('(')[0].trim()}...`
                  : selectedMode === 'study_method'
                  ? 'Hỏi về mẹo học, cách ôn thi môn học, phương pháp Pomodoro...'
                  : 'Hỏi về quy chế tín chỉ, điểm F, môn tiên quyết, cảnh báo học vụ...'
              }
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition shadow-inner"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium transition flex items-center justify-center shrink-0 shadow-sm ${
              inputQuestion.trim() && !isLoading
                ? selectedMode === 'freshman_empathy'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : selectedMode === 'university_info'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Gửi câu hỏi"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Real-Time Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        mode={selectedMode}
        university={selectedUniversity}
        major={customMajor}
      />
    </div>
  );
};
