import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  ThinkingLevel,
  Modality,
  LiveServerMessage,
} from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google GenAI with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const liveAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: 'v1beta' },
});

function buildSystemInstruction(
  mode: string,
  university: string,
  major: string
): string {
  const contextLine = `Ngữ cảnh sinh viên: Trường "${university}", Ngành "${major}".`;

  if (mode === 'freshman_empathy') {
    return `Bạn là "Bạn Cùng Phòng Ảo" (UniBuddy Companion) - người bạn đồng hành ấm áp, thấu cảm, dịu dàng dành cho tân sinh viên và sinh viên xa nhà tại Việt Nam.
${contextLine}
Luôn lắng nghe chân thành, an ủi, công nhận cảm xúc của người dùng khi nhớ nhà, cô đơn, áp lực đồng trang lứa, mâu thuẫn phòng trọ. Xưng hô 'mình' - 'bạn'. Đưa ra lời khuyên từng bước nhỏ, ấm áp, tích cực bằng tiếng Việt tự nhiên.`;
  }
  if (mode === 'university_info') {
    return `Bạn là Chuyên gia Thông tin & Đời sống Đại học Việt Nam (UniBuddy VN).
${contextLine}
Am hiểu tường tận về các trường Đại học tại Việt Nam, đặc biệt là Học viện Ngân hàng (HVNH), NEU, FTU, HUST, UEH, ĐHQG. Tư vấn tuyển sinh, điểm chuẩn, KTX, học phí, học bổng, câu lạc bộ. Khi có thông tin tìm kiếm web mới nhất, hãy tổng hợp chính xác, rõ ràng bằng tiếng Việt.`;
  }
  if (mode === 'study_method') {
    return `Bạn là Cố Vấn Phương Pháp Học Tập & Kế Hoạch Ôn Thi Đại Học (UniBuddy VN).
${contextLine}
Hướng dẫn phương pháp Pomodoro, Feynman, Spaced Repetition, Active Recall, lập kế hoạch ôn thi chi tiết theo ngày, đối phó teamwork và freeriders. Trình bày khoa học, dễ áp dụng bằng tiếng Việt.`;
  }
  return `Bạn là Trợ Lý Cố Vấn Học Vụ Đại Học Việt Nam (UniBuddy VN).
${contextLine}
Am hiểu sâu sắc về Quy chế đào tạo tín chỉ theo chuẩn Bộ GD&ĐT (Thông tư 08/2021/TT-BGDĐT): điểm chữ A, B, C, D, F, thang 4 GPA, học phần tiên quyết, học lại, cảnh báo học vụ, điểm rèn luyện ĐRL, thủ tục sinh viên. Trả lời rõ ràng, chính xác bằng tiếng Việt.`;
}

// Fallback intelligent knowledge responses for Vietnamese student queries
function getFallbackResponse(question: string, mode: string, _university: string): string {
  const q = question.toLowerCase();

  if (
    mode === 'freshman_empathy' ||
    q.includes('nhớ nhà') ||
    q.includes('cô đơn') ||
    q.includes('tủi thân') ||
    q.includes('xa nhà') ||
    q.includes('lạc lõng')
  ) {
    return `💙 **Chào bạn, mình hiểu cảm giác này mà...**

Lần đầu rời xa vòng tay gia đình lên một thành phố lớn như Hà Nội hay TP.HCM, tự mình lo từ bữa ăn, giặt giũ, đi lại giữa dòng xe cộ tấp nập, cảm giác trống trải và bật khóc vào mỗi buổi tối là điều **hoàn toàn bình thường**. Gần như bất kỳ bạn tân sinh viên nào cũng từng trải qua cảm giác này trong 2-4 tuần đầu tiên.

Một vài gợi ý nhỏ ấm áp dành cho bạn ngay lúc này:
1. **Gọi điện về nhà 5-10 phút:** Chỉ cần nghe giọng bố mẹ, kể hôm nay ăn món gì sẽ giúp bạn thấy lòng bình yên hơn rất nhiều.
2. **Cho phép bản thân buồn:** Đừng tự trách mình yếu đuối. Nhớ nhà là minh chứng bạn đã có một mái ấm tuyệt vời để hướng về.
3. **Bước ra ngoài hít thở:** Chiều nay hãy thử đi bộ nhẹ nhàng quanh khu trọ hoặc ghé thư viện trường để dần làm quen với nhịp sống mới.

*UniBuddy luôn ở đây cùng bạn. Cứ mỗi lần thấy lòng chông chênh, hãy ghé vào đây tâm sự cùng mình nhé!*`;
  }

  if (
    q.includes('tiên quyết') ||
    q.includes('điểm f') ||
    q.includes('rớt môn') ||
    q.includes('nợ môn') ||
    q.includes('trượt')
  ) {
    return `🎓 **Quy chế về Điểm F và Học phần Tiên quyết theo Bộ GD&ĐT:**

1. **Khái niệm Học phần Tiên quyết:** Là học phần sinh viên **bắt buộc phải tích lũy đạt** (từ điểm D trở lên) mới được đăng ký học phần tiếp theo.
2. **Nếu bị điểm F:** Điểm F tính 0.0 vào GPA kỳ và bạn chưa được tích lũy tín chỉ môn đó, nên hệ thống sẽ khóa không cho đăng ký môn học sau yêu cầu môn này làm tiên quyết.
3. **Giải pháp:** Đăng ký học lại ngay ở **Kỳ phụ (học kỳ hè)** hoặc kỳ chính tiếp theo để cải thiện điểm và mở khóa lộ trình học.`;
  }

  return `🎓 **Cố Vấn Học Vụ UniBuddy VN xin giải đáp:**

Về thắc mắc của bạn: *"${question}"*

1. **Nguyên tắc học tập đại học theo tín chỉ:** Chủ động theo dõi đề cương môn học, giữ điểm thành phần (chuyên cần 10% + giữa kỳ 30%) từ 8.5 trở lên để giảm áp lực thi cuối kỳ.
2. **Lời khuyên thực tiễn:** Luôn kiểm tra cổng thông tin đào tạo của trường hàng tuần hoặc liên hệ Phòng Đào tạo / CTSV nếu cần xác nhận thủ tục chính thức.`;
}

// Primary multi-turn Q&A endpoint using Gemini 4 Hydrogen (with optional Google Search grounding & fast mode)
app.post('/api/gemini/student-qa', async (req, res) => {
  const {
    question,
    mode = 'academic',
    university = 'Học viện Ngân hàng (HVNH)',
    major = 'Tài chính - Ngân hàng / Kinh tế',
    history = [],
    useSearch = false,
    speedMode = 'fast', // 'fast' | 'balanced' | 'deep'
  } = req.body;

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Vui lòng cung cấp câu hỏi.' });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return res.status(503).json({ error: 'Máy chủ chưa được cấu hình khóa Gemini.' });
  }

  try {
    const systemInstruction = buildSystemInstruction(mode, university, major);

    // Choose model and thinking configuration according to task complexity
    // Note: googleSearch tool is supported on gemini-4-hydrogen
    const isFast = speedMode === 'fast' && !useSearch;
    const flashModel = 'gemini-3.1-flash-lite';
    const hydrogenModel = 'gemini-4-hydrogen';
    const preferredModel = isFast ? flashModel : hydrogenModel;

    // Sanitize history so it starts with a 'user' message and alternates cleanly
    const rawHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter((m: { content?: string }) => typeof m?.content === 'string' && m.content.trim().length > 0)
          .map((m: { role: string; content: string }) => ({
            role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            parts: [{ text: m.content }],
          }))
      : [];

    const firstUserIdx = rawHistory.findIndex((m) => m.role === 'user');
    const slicedHistory = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];
    const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const turn of slicedHistory) {
      const prev = chatHistory[chatHistory.length - 1];
      if (prev && prev.role === turn.role) {
        prev.parts[0].text += `\n\n${turn.parts[0].text}`;
      } else {
        chatHistory.push(turn);
      }
    }

    const sendQuestion = (model: string) => {
      const config: Record<string, any> = { systemInstruction };
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }
      if (model === hydrogenModel) {
        if (speedMode === 'deep') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        } else if (speedMode === 'fast') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
      }
      const chat = ai.chats.create({ model, history: chatHistory, config });
      return chat.sendMessage({ message: question });
    };

    let modelUsed = preferredModel;
    const response = await sendQuestion(preferredModel).catch(async (err) => {
      if (geminiStatus(err) !== 503) throw err;
      await delay(1000 + Math.random() * 500);
      return sendQuestion(preferredModel);
    }).catch((err) => {
      if (useSearch || ![429, 503].includes(geminiStatus(err))) throw err;
      modelUsed = preferredModel === flashModel ? hydrogenModel : flashModel;
      return sendQuestion(modelUsed);
    });
    const text = response.text?.trim();

    // Extract Google Search grounding sources if present
    const rawChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seenUris = new Set<string>();
    const sources: { title: string; uri: string }[] = [];

    for (const chunk of rawChunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title || uri;
      if (uri && !seenUris.has(uri)) {
        seenUris.add(uri);
        sources.push({ title: title || 'Nguồn tham khảo', uri });
      }
    }

    if (text) {
      return res.json({
        reply: text,
        sources,
        modelUsed,
      });
    }

    if (useSearch) {
      return res.status(502).json({
        error: 'Google Search không trả về câu trả lời. Hãy thử lại hoặc tắt Google Search để tiếp tục chat.',
      });
    }
    return res.status(502).json({
      error: 'Gemini không trả về nội dung. Bạn có thể thử diễn đạt lại câu hỏi.',
    });
  } catch (err: any) {
    console.warn('Gemini API call warning:', err?.message);
    const status = geminiStatus(err);
    if (status === 503) {
      return res.status(503).json({
        error: 'Gemini đang quá tải. Vui lòng đợi một lúc rồi gửi lại câu hỏi.',
      });
    }
    if (useSearch) {
      return res.status(status === 429 ? 429 : 502).json({
        error: status === 429 || status === 403
          ? 'Google Search không khả dụng với gói hoặc hạn mức Gemini hiện tại. Hãy tắt Google Search và gửi lại câu hỏi.'
          : 'Không thể tra cứu qua Google Search. Hãy thử lại hoặc tắt Google Search để tiếp tục chat.',
      });
    }
    if (status === 401 || status === 403 || (status === 400 && /API_KEY_INVALID/.test(err?.message))) {
      return res.status(status).json({
        error: 'Khóa Gemini bị từ chối. Hãy kiểm tra GEMINI_API_KEY trong file .env.',
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: 'Gemini đã chạm hạn mức. Vui lòng thử lại khi hạn mức được làm mới.',
      });
    }
    return res.status(502).json({
      error: 'Gemini đang gặp lỗi khi xử lý câu hỏi. Vui lòng thử lại sau.',
    });
  }
});

function geminiStatus(error: unknown): number {
  const { status, code } = (error ?? {}) as { status?: number | string; code?: number | string };
  return Number(status || code);
}

// Helper to parse timetable JSON string from model response safely
function extractJsonArray(text: string): any[] {
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    return JSON.parse(clean);
  } catch (e) {
    return [];
  }
}

// Fallback for pasted rows with an explicit day and time range.
function heuristicParseScheduleText(rawText: string): any[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: any[] = [];
  const daysMap: Record<string, string> = {
    'thứ hai': 'T2', 'thứ 2': 'T2', 't2': 'T2', 'thứ ba': 'T3', 'thứ 3': 'T3', 't3': 'T3',
    'thứ tư': 'T4', 'thứ 4': 'T4', 't4': 'T4', 'thứ năm': 'T5', 'thứ 5': 'T5', 't5': 'T5',
    'thứ sáu': 'T6', 'thứ 6': 'T6', 't6': 'T6', 'thứ bảy': 'T7', 'thứ 7': 'T7', 't7': 'T7',
    'chủ nhật': 'CN', 'cn': 'CN',
  };

  for (const line of lines) {
    if (line.startsWith('[') && line.endsWith(']:')) continue;
    const lower = line.toLowerCase();
    const cleanLine = line.replace(/^\d+[\.\-\)]\s*/, '');
    const tokens = cleanLine.split(/[,\t|;]/).map((t) => t.trim()).filter(Boolean);
    const foundDay = tokens.map((token) => daysMap[token.toLowerCase()]).find(Boolean);
    const timeRange = lower.match(/\b([01]\d|2[0-3]):([0-5]\d)\s*[-–—]\s*([01]\d|2[0-3]):([0-5]\d)\b/);
    if (foundDay && timeRange && tokens[0].length > 1) {
      const startTime = `${timeRange[1]}:${timeRange[2]}`;
      const endTime = `${timeRange[3]}:${timeRange[4]}`;
      if (startTime >= endTime) continue;
      const name = tokens[0].replace(/^(thứ \d|t\d|cn)/i, '').trim() || 'Học phần mới';
      const code =
        tokens[1] && tokens[1].length <= 10 && !tokens[1].toLowerCase().includes('thứ')
          ? tokens[1].toUpperCase()
          : 'HP' + Math.floor(100 + Math.random() * 900);

      const roomToken =
        tokens.find((t) => /(phòng|lab|giảng đường|[A-Z]\.\d+|[A-Z]\d+)/i.test(t)) ||
        tokens[3] ||
        'Giảng đường';
      const lecturerToken =
        tokens.find((t) => /(TS\.|ThS\.|PGS\.|GS\.|Thầy|Cô)/i.test(t)) || '';

      items.push({
        subjectName: name,
        subjectCode: code,
        dayOfWeek: foundDay,
        shift: `${startTime} - ${endTime}`,
        startTime,
        endTime,
        room: roomToken.replace(/^phòng\s*/i, ''),
        lecturer: lecturerToken,
        credits: 3,
        type: 'lecture',
        notes: 'Nhập tự động',
      });
    }
  }

  return items;
}

// API: Auto-parse Timetable from Image (base64) or URL or Raw Text
app.post('/api/schedule/parse', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', url, rawText } = req.body;

    if (!imageBase64 && !url && !rawText) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp ảnh chụp thời khóa biểu, đường link hoặc văn bản TKB.',
      });
    }

    let promptContext = '';
    const parts: any[] = [];

    if (url) {
      try {
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UniBuddy/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const textCleaned = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 15000);
          promptContext += `\n[Nội dung trang web từ link ${url}]:\n${textCleaned}\n`;
        } else {
          promptContext += `\n[Đường link thời khóa biểu]: ${url}\n`;
        }
      } catch (e: any) {
        promptContext += `\n[Đường link thời khóa biểu]: ${url}\n`;
      }
    }

    if (rawText) {
      promptContext += `\n[Văn bản thời khóa biểu do người dùng cung cấp]:\n${rawText}\n`;
    }

    const extractionInstruction = `Bạn là chuyên gia phân tích thời khóa biểu đại học tại Việt Nam (HVNH, NEU, FTU, HUST, UEH, ĐHQG...).
Nhiệm vụ của bạn: Trích xuất chính xác toàn bộ danh sách các môn học / học phần / ca học trong ảnh chụp hoặc văn bản/link thành một mảng JSON các đối tượng.
Nếu dữ liệu không có thời khóa biểu hoặc không đọc được ca học, trả về []. Chỉ trích xuất các ca có tên môn, thứ, giờ bắt đầu và giờ kết thúc đọc được từ dữ liệu đầu vào.

Mỗi phần tử trong mảng phải có cấu trúc JSON chính xác:
[
  {
    "subjectName": "Tên môn học",
    "subjectCode": "Mã học phần nếu có",
    "dayOfWeek": "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "CN",
    "shift": "Tên ca (ví dụ: 'Ca 1 (07:00 - 09:30)')",
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "room": "Phòng học / Giảng đường",
    "lecturer": "Tên giảng viên nếu có hoặc ''",
    "credits": 3,
    "type": "lecture" | "lab" | "online" | "exam",
    "notes": "Ghi chú tiết học"
  }
]

Chỉ trả về duy nhất mảng JSON hợp lệ, KHÔNG kèm theo lời giải thích.`;

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data,
        },
      });
      parts.push({
        text: `Đây là ảnh chụp màn hình thời khóa biểu cổng thông tin sinh viên. ${extractionInstruction}`,
      });
    } else {
      parts.push({
        text: `${extractionInstruction}\n\nThông tin đầu vào:${promptContext}`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'Bạn là bộ trích xuất dữ liệu thời khóa biểu đại học chuyên nghiệp, luôn xuất định dạng JSON array.',
        },
      });

      const text = response.text || '';
      const parsed = extractJsonArray(text);
      const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      const parsedItems = Array.isArray(parsed) ? parsed.filter((item) =>
        typeof item?.subjectName === 'string' &&
        item.subjectName.trim() &&
        ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].includes(item.dayOfWeek) &&
        validTime.test(item.startTime) &&
        validTime.test(item.endTime) &&
        item.startTime < item.endTime
      ) : [];

      if (parsedItems.length > 0) {
        return res.json({
          success: true,
          count: parsedItems.length,
          items: parsedItems,
          source: 'ai_vision',
        });
      }
    } catch (apiErr: any) {
      console.warn('Gemini vision parse timetable warning:', apiErr?.message);
    }

    const fallbackList = typeof rawText === 'string' && !imageBase64
      ? heuristicParseScheduleText(rawText)
      : [];
    if (fallbackList.length > 0) {
      return res.json({
        success: true,
        count: fallbackList.length,
        items: fallbackList,
        source: 'heuristic',
        message: 'Trích xuất tự động thành công (chế độ dự phòng).',
      });
    }

    return res.status(422).json({
      error:
        'Không tìm thấy ca học có đủ thông tin. Hãy thử ảnh rõ hơn hoặc dán văn bản có tên môn, thứ và giờ học.',
    });
  } catch (err: any) {
    console.error('Timetable parse error:', err);
    return res.status(500).json({
      error: 'Lỗi máy chủ khi phân tích thời khóa biểu: ' + err?.message,
    });
  }
});

// Backward-compatibility endpoints
app.post('/api/gemini/academic-advisor', async (req, res) => {
  const { question, university } = req.body;
  const reply = getFallbackResponse(question || '', 'academic', university || 'Đại học');
  return res.json({ answer: reply });
});

app.post('/api/gemini/companion', async (req, res) => {
  const { message } = req.body;
  const reply = getFallbackResponse(message || '', 'freshman_empathy', 'Đại học');
  return res.json({ reply });
});

app.post('/api/gemini/study-plan', async (req, res) => {
  const { subjectName, daysRemaining, targetGrade } = req.body;
  const plan = `📅 **KẾ HOẠCH ÔN THI MÔN ${subjectName ? subjectName.toUpperCase() : 'HỌC PHẦN'} (${daysRemaining || 14} NGÀY TỚI)**
Mục tiêu: Đạt điểm **${targetGrade || 'A'}**

🔹 **Giai đoạn 1 (Ngày 1 - 5): Hệ thống hóa kiến thức & Đọc lại Slide**
- Đọc lướt toàn bộ giáo trình và note lại các đề mục lớn.
- Dùng phương pháp Pomodoro 25/5 và vẽ sơ đồ tư duy (Mindmap).

🔹 **Giai đoạn 2 (Ngày 6 - 10): Luyện giải Đề thi các năm trước**
- Tự bấm giờ làm đề thi KTHP 2-3 năm gần nhất và ghi lại lỗi sai.

🔹 **Giai đoạn 3 (Ngày 11 - 14): Tổng ôn & Chuẩn bị tâm lý**
- Ôn công thức trọng tâm bằng Flashcard, ngủ đủ giấc trước ngày thi!`;
  return res.json({ plan });
});

// Serve frontend in production or via Vite dev server, plus attach Live API WebSocket bridge
async function startServer() {
  const server = http.createServer(app);

  // WebSocket bridge for Gemini 3.8 Live real-time voice conversations
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs, req) => {
    let liveSession: any = null;
    let isClosed = false;
    clientWs.on('close', () => {
      isClosed = true;
      liveSession?.close();
    });

    try {
      const reqUrl = new URL(req.url || '/live', `http://${req.headers.host || 'localhost'}`);
      const mode = reqUrl.searchParams.get('mode') || 'academic';
      const university = reqUrl.searchParams.get('university') || 'Học viện Ngân hàng (HVNH)';
      const major = reqUrl.searchParams.get('major') || 'Sinh viên đại học';
      const voiceName = reqUrl.searchParams.get('voice') || 'Zephyr';

      const baseInstruction = buildSystemInstruction(mode, university, major);
      const voiceInstruction = `${baseInstruction}
Đây là cuộc trò chuyện giọng nói trực tiếp (Live Voice). Hãy trả lời tự nhiên, thân thiện, ngắn gọn súc tích (2-4 câu mỗi lượt trừ khi người dùng hỏi chi tiết), dễ nghe như đang trò chuyện qua điện thoại với bạn sinh viên.`;

      liveSession = await liveAi.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          systemInstruction: voiceInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscript',
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'outputTranscript',
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                  })
                );
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: any) => {
            console.warn('Gemini Live session error:', err?.message || err);
            if (liveSession && !isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error:
                    err?.message ||
                    'Kết nối giọng nói Live API gặp sự cố. Vui lòng kiểm tra GEMINI_API_KEY.',
                })
              );
            }
          },
          onclose: () => {
            if (liveSession && !isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });
      if (isClosed || clientWs.readyState !== WebSocket.OPEN) {
        liveSession.close();
        return;
      }
      clientWs.send(JSON.stringify({ type: 'ready' }));
    } catch (err: any) {
      console.error('Failed to initialize Gemini Live session:', err?.message || err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error:
              err?.message ||
              'Không thể khởi tạo phiên đàm thoại giọng nói Gemini Live.',
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (rawData) => {
      if (!liveSession || isClosed) return;
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === 'audio' && msg.data) {
          liveSession.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.type === 'text' && msg.text) {
          liveSession.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (e) {
        console.warn('Malformed client WebSocket payload:', e);
      }
    });

  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`UniBuddy Server running at http://localhost:${PORT}`);
  });
}

startServer();
