import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2, SlidersHorizontal, Check, X } from 'lucide-react';
import { playGentleChime } from '../utils/academicUtils';

interface PomodoroSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const StudyFocusPomodoro: React.FC = () => {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('unibuddy_pomodoro_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.work > 0 && parsed.shortBreak > 0 && parsed.longBreak > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(() => settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundAmbient, setSoundAmbient] = useState<'none' | 'rain' | 'whitenoise'>('none');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Settings panel states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draftWork, setDraftWork] = useState(settings.work);
  const [draftShortBreak, setDraftShortBreak] = useState(settings.shortBreak);
  const [draftLongBreak, setDraftLongBreak] = useState(settings.longBreak);

  const [tasks, setTasks] = useState<{ id: string; title: string; done: boolean }[]>([
    { id: 't1', title: 'Đọc chương 3: Cung Cầu Kinh tế Vi mô (20 trang)', done: false },
    { id: 't2', title: 'Làm 5 câu hỏi trắc nghiệm Triết học Mác - Lênin', done: false },
    { id: 't3', title: 'Ghi chép từ vựng Tiếng Anh bài nghe', done: true },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Audio Context Ref for ambient sound synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playGentleChime();
      setIsRunning(false);
      if (mode === 'work') {
        setStatusMessage(`🎉 Chúc mừng bạn đã hoàn thành 1 phiên tập trung! Hãy đứng dậy nghỉ ngơi ${settings.shortBreak} phút nhé.`);
        setMode('shortBreak');
        setTimeLeft(settings.shortBreak * 60);
      } else {
        setStatusMessage(`⏰ Hết giờ giải lao rồi! Cùng bước vào phiên học tập ${settings.work} phút tiếp theo nào.`);
        setMode('work');
        setTimeLeft(settings.work * 60);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, settings]);

  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setStatusMessage(null);
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStatusMessage(null);
    setTimeLeft(settings[mode] * 60);
  };

  const openSettings = () => {
    setDraftWork(settings.work);
    setDraftShortBreak(settings.shortBreak);
    setDraftLongBreak(settings.longBreak);
    setIsSettingsOpen((prev) => !prev);
  };

  const applySettings = (nextSettings: PomodoroSettings) => {
    const sanitized: PomodoroSettings = {
      work: Math.min(180, Math.max(1, Math.round(nextSettings.work) || DEFAULT_SETTINGS.work)),
      shortBreak: Math.min(60, Math.max(1, Math.round(nextSettings.shortBreak) || DEFAULT_SETTINGS.shortBreak)),
      longBreak: Math.min(90, Math.max(1, Math.round(nextSettings.longBreak) || DEFAULT_SETTINGS.longBreak)),
    };
    setSettings(sanitized);
    setDraftWork(sanitized.work);
    setDraftShortBreak(sanitized.shortBreak);
    setDraftLongBreak(sanitized.longBreak);
    localStorage.setItem('unibuddy_pomodoro_settings', JSON.stringify(sanitized));
    setIsRunning(false);
    setTimeLeft(sanitized[mode] * 60);
    setStatusMessage(null);
    setIsSettingsOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    applySettings({
      work: draftWork,
      shortBreak: draftShortBreak,
      longBreak: draftLongBreak,
    });
  };

  // Toggle ambient white noise/rain generator
  const toggleAmbientSound = (type: 'none' | 'rain' | 'whitenoise') => {
    // Stop current ambient
    if (ambientNodeRef.current) {
      try {
        (ambientNodeRef.current as AudioBufferSourceNode).stop?.();
        ambientNodeRef.current.disconnect();
      } catch (e) {}
      ambientNodeRef.current = null;
    }

    if (type === 'none' || soundAmbient === type) {
      setSoundAmbient('none');
      return;
    }

    setSoundAmbient(type);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate 4 seconds buffer of white/pink noise
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pinkish noise filter
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.15; // low volume
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter
      const biquad = ctx.createBiquadFilter();
      biquad.type = type === 'rain' ? 'lowpass' : 'bandpass';
      biquad.frequency.value = type === 'rain' ? 800 : 1200;

      const gain = ctx.createGain();
      gain.gain.value = 0.08; // very soft and unobtrusive

      noiseSource.connect(biquad);
      biquad.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      ambientNodeRef.current = noiseSource;
    } catch (e) {
      console.warn('Ambient audio could not be initialized', e);
    }
  };

  useEffect(() => {
    return () => {
      if (ambientNodeRef.current) {
        try {
          (ambientNodeRef.current as AudioBufferSourceNode).stop?.();
          ambientNodeRef.current.disconnect();
        } catch (e) {}
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, { id: `task-${Date.now()}`, title: newTaskInput.trim(), done: false }]);
    setNewTaskInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Pomodoro Box */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
        {/* Mode Switcher + Custom Settings Trigger */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => switchMode('work')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg transition ${
                mode === 'work' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 Tập Trung ({settings.work}p)
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg transition ${
                mode === 'shortBreak' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☕ Nghỉ Ngắn ({settings.shortBreak}p)
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg transition ${
                mode === 'longBreak' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌴 Nghỉ Dài ({settings.longBreak}p)
            </button>
          </div>

          <button
            onClick={openSettings}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              isSettingsOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Tự thiết lập thời gian học & nghỉ"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tùy chỉnh</span>
          </button>
        </div>

        {/* Custom Time Settings Panel */}
        {isSettingsOpen && (
          <form
            onSubmit={handleSaveSettings}
            className="w-full max-w-lg mb-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                Tự thiết lập thời gian của bạn (phút)
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tập trung</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={draftWork}
                  onChange={(e) => setDraftWork(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nghỉ ngắn</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draftShortBreak}
                  onChange={(e) => setDraftShortBreak(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nghỉ dài</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={draftLongBreak}
                  onChange={(e) => setDraftLongBreak(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Gợi ý:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDraftWork(25);
                    setDraftShortBreak(5);
                    setDraftLongBreak(15);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg font-medium text-slate-700"
                >
                  25/5/15 (Chuẩn)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftWork(45);
                    setDraftShortBreak(10);
                    setDraftLongBreak(20);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg font-medium text-slate-700"
                >
                  45/10/20 (Ôn thi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftWork(50);
                    setDraftShortBreak(10);
                    setDraftLongBreak(30);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg font-medium text-slate-700"
                >
                  50/10/30 (Học sâu)
                </button>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Áp dụng
              </button>
            </div>
          </form>
        )}

        {/* Session completion banner */}
        {statusMessage && (
          <div className="w-full max-w-lg mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center justify-between gap-2 text-left">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Big Digital Clock */}
        <div className="text-6xl sm:text-8xl font-black text-slate-800 tracking-tight my-2 font-mono">
          {formatTime(timeLeft)}
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          {mode === 'work'
            ? 'Đóng các tab mạng xã hội, tập trung giải quyết 1 nhiệm vụ duy nhất!'
            : 'Uống một cốc nước, vươn vai và thả lỏng mắt nhìn ra xa.'}
        </p>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStatusMessage(null);
              setIsRunning(!isRunning);
            }}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-white shadow-md transition flex items-center gap-2 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" /> Tạm Dừng
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" /> Bắt Đầu Học
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Sound Selector */}
        <div className="mt-7 pt-5 border-t border-slate-100 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span className="font-semibold flex items-center gap-1.5 text-slate-700">
            <Volume2 className="w-4 h-4 text-emerald-600" /> Âm thanh nền tập trung (Web Audio):
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAmbientSound('rain')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                soundAmbient === 'rain'
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              🌧️ Tiếng mưa êm dịu
            </button>

            <button
              onClick={() => toggleAmbientSound('whitenoise')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                soundAmbient === 'whitenoise'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              📖 Thư viện yên tĩnh
            </button>

            {soundAmbient !== 'none' && (
              <button
                onClick={() => toggleAmbientSound('none')}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100"
                title="Tắt âm thanh"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Focus Session Tasks */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mục Tiêu Phiên Học Này
            </h3>
            <span className="text-xs text-slate-400">
              {tasks.filter((t) => t.done).length}/{tasks.length} đã xong
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Thêm mục tiêu nhỏ cần làm..."
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Thêm
            </button>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 text-xs ${
                  task.done
                    ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 cursor-pointer"
                />
                <span className="leading-snug">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 mt-4">
          ✨ <strong>Phương pháp Feynman:</strong> Sau mỗi {settings.work} phút đọc bài, hãy thử giải thích lại nội dung đó cho một người bạn (hoặc tự nói thành tiếng) bằng từ ngữ đơn giản nhất!
        </div>
      </div>
    </div>
  );
};
