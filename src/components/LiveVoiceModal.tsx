import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QAMode } from '../types';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  X,
  Sparkles,
  Radio,
  MessageSquare,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: QAMode;
  university: string;
  major: string;
}

interface TranscriptLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const VOICE_OPTIONS = [
  { id: 'Zephyr', label: 'Zephyr (Ấm áp)' },
  { id: 'Kore', label: 'Kore (Nhẹ nhàng)' },
  { id: 'Puck', label: 'Puck (Năng động)' },
  { id: 'Charon', label: 'Charon (Trầm ấm)' },
  { id: 'Fenrir', label: 'Fenrir (Rõ ràng)' },
];

function float32ToPcm16Base64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(len / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}

export const LiveVoiceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  university,
  major,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  }, []);

  const cleanupSession = useCallback(() => {
    stopPlayback();
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      try {
        inputCtxRef.current.close();
      } catch (e) {}
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      try {
        outputCtxRef.current.close();
      } catch (e) {}
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setStatus('idle');
    setIsAiSpeaking(false);
  }, [stopPlayback]);

  const scheduleAudioChunk = useCallback((base64Pcm: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const float32 = base64Pcm16ToFloat32(base64Pcm);
    if (float32.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextStartTimeRef.current);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setIsAiSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsAiSpeaking(false);
      }
    };

    source.start(startAt);
  }, []);

  const appendTranscript = useCallback((role: 'user' | 'assistant', chunk: string) => {
    const clean = chunk;
    if (!clean) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text}${clean}` },
        ];
      }
      return [...prev, { id: `${role}-${Date.now()}`, role, text: clean }];
    });
  }, []);

  const startLiveSession = useCallback(async () => {
    cleanupSession();
    setErrorMsg(null);
    setTranscripts([]);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        mode,
        university,
        major,
        voice: selectedVoice,
      });
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/live?${params.toString()}`);
      wsRef.current = ws;

      const startMicrophone = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return;
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const channelData = e.inputBuffer.getChannelData(0);
          const base64 = float32ToPcm16Base64(channelData);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            startMicrophone();
            setStatus('connected');
          } else if (msg.type === 'audio' && msg.data) {
            scheduleAudioChunk(msg.data);
          } else if (msg.type === 'inputTranscript' && msg.text) {
            appendTranscript('user', msg.text);
          } else if (msg.type === 'outputTranscript' && msg.text) {
            appendTranscript('assistant', msg.text);
          } else if (msg.type === 'interrupted') {
            stopPlayback();
          } else if (msg.type === 'error') {
            cleanupSession();
            setErrorMsg(msg.error || 'Lỗi kết nối giọng nói.');
            setStatus('error');
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        cleanupSession();
        setErrorMsg('Không thể kết nối WebSocket đến máy chủ Live API.');
        setStatus('error');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) cleanupSession();
      };
    } catch (err: any) {
      setErrorMsg(
        err?.name === 'NotAllowedError'
          ? 'Bạn chưa cấp quyền sử dụng Micro. Vui lòng bật quyền Micro trong trình duyệt để trò chuyện.'
          : err?.message || 'Không thể khởi động Micro.'
      );
      setStatus('error');
    }
  }, [appendTranscript, cleanupSession, major, mode, scheduleAudioChunk, selectedVoice, stopPlayback, university]);

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
    }
    return () => {
      cleanupSession();
    };
  }, [isOpen, cleanupSession]);

  if (!isOpen) return null;

  const sendQuickVoicePrompt = (prompt: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: prompt }));
      appendTranscript('user', prompt);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 text-white relative">
          <button
            type="button"
            onClick={() => {
              cleanupSession();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Radio className={`w-6 h-6 ${status === 'connected' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Đàm Thoại Trực Tiếp (Live Voice)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  Gemini 3.8 Live
                </span>
              </div>
              <p className="text-xs text-white/85 mt-0.5">
                Nói chuyện hai chiều thời gian thực cùng UniBuddy VN
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Voice selector (when idle or error) */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              Giọng nói trợ lý:
            </span>
            <select
              value={selectedVoice}
              disabled={status === 'connected' || status === 'connecting'}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none disabled:opacity-60"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live Status Orb */}
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                status === 'connected'
                  ? isAiSpeaking
                    ? 'bg-gradient-to-tr from-indigo-500 to-teal-500 text-white scale-105 ring-8 ring-teal-100'
                    : isMuted
                    ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white ring-8 ring-emerald-100 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-slate-200 text-slate-600 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {status === 'connected' ? (
                isMuted ? (
                  <MicOff className="w-9 h-9" />
                ) : isAiSpeaking ? (
                  <Volume2 className="w-9 h-9 animate-bounce" />
                ) : (
                  <Mic className="w-9 h-9" />
                )
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </div>

            <p className="text-xs font-bold text-slate-700 mt-3">
              {status === 'idle' && 'Nhấn "Bắt đầu cuộc gọi" để trò chuyện bằng giọng nói'}
              {status === 'connecting' && 'Đang kết nối micro và Gemini Live...'}
              {status === 'connected' &&
                (isAiSpeaking
                  ? 'UniBuddy đang trả lời...'
                  : isMuted
                  ? 'Micro đang tạm tắt'
                  : 'Đang lắng nghe bạn nói...')}
              {status === 'error' && 'Kết nối bị gián đoạn'}
            </p>

            {errorMsg && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Live Transcript Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 h-40 overflow-y-auto space-y-2 text-xs">
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <MessageSquare className="w-5 h-5 mb-1 opacity-60" />
                <span>Phụ đề trực tiếp cuộc trò chuyện sẽ hiển thị tại đây.</span>
              </div>
            ) : (
              transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`p-2 rounded-xl leading-relaxed ${
                    t.role === 'user'
                      ? 'bg-slate-800 text-white ml-6'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6'
                  }`}
                >
                  <span className="font-bold text-[10px] opacity-75 block mb-0.5">
                    {t.role === 'user' ? 'Bạn' : 'UniBuddy'}
                  </span>
                  {t.text}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Quick prompts when connected */}
          {status === 'connected' && (
            <div className="flex flex-wrap gap-1.5">
              {[
                'Chào UniBuddy, tư vấn giúp mình cách ôn thi hiệu quả!',
                'Mình đang thấy hơi áp lực học tập',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendQuickVoicePrompt(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition font-medium"
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {status === 'idle' || status === 'error' ? (
              <button
                type="button"
                onClick={startLiveSession}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Bắt đầu cuộc gọi Live
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  disabled={status !== 'connected'}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border ${
                    isMuted
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Bật Micro' : 'Tắt Micro'}
                </button>

                <button
                  type="button"
                  onClick={cleanupSession}
                  className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <PhoneOff className="w-4 h-4" />
                  Kết thúc
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
