import React, { useState } from 'react';
import { SemesterGpaRecord } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { TrendingUp, Plus, Trash2, Award, Sparkles, BarChart3, LineChart as LineChartIcon, Check } from 'lucide-react';

interface Props {
  semesterHistory: SemesterGpaRecord[];
  onUpdateSemesterHistory: (newHistory: SemesterGpaRecord[]) => void;
  currentSemesterGpa: number;
}

export const GpaTrendChart: React.FC<Props> = ({
  semesterHistory,
  onUpdateSemesterHistory,
  currentSemesterGpa,
}) => {
  const [chartType, setChartType] = useState<'line' | 'composed'>('composed');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSemName, setNewSemName] = useState('');
  const [newGpa, setNewGpa] = useState<number>(3.5);
  const [newCredits, setNewCredits] = useState<number>(18);
  const [targetGpa, setTargetGpa] = useState<number>(3.6); // Target goal line

  // Prepare chart data with dynamically computed CPA if needed
  const chartData = semesterHistory.map((sem, idx) => {
    // Determine classification color
    const gradeClass = sem.gpaFour >= 3.6 ? 'Xuất sắc' : sem.gpaFour >= 3.2 ? 'Giỏi' : sem.gpaFour >= 2.5 ? 'Khá' : 'Trung bình';
    return {
      name: sem.semesterName.replace('Kỳ ', 'K').replace(' (Hiện tại)', '*'),
      fullName: sem.semesterName,
      GPA: Number(sem.gpaFour.toFixed(2)),
      CPA: Number(sem.cpaFour.toFixed(2)),
      'GPA Hệ 10': Number(sem.gpaTen.toFixed(2)),
      credits: sem.credits,
      classification: sem.classification || gradeClass,
    };
  });

  const handleAddSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemName.trim()) return;

    // Recalculate cumulative CPA
    const prevCredits = semesterHistory.reduce((acc, cur) => acc + cur.credits, 0);
    const prevPoints = semesterHistory.reduce((acc, cur) => acc + cur.cpaFour * cur.credits, 0);
    const totalCredits = prevCredits + newCredits;
    const computedCpa = totalCredits > 0 ? Number(((prevPoints + newGpa * newCredits) / totalCredits).toFixed(2)) : newGpa;

    const gpaTen = Number((newGpa * 2.5).toFixed(2));
    const gradeClass = newGpa >= 3.6 ? 'Xuất sắc' : newGpa >= 3.2 ? 'Giỏi' : newGpa >= 2.5 ? 'Khá' : 'Trung bình';

    const newRecord: SemesterGpaRecord = {
      id: `sem-${Date.now()}`,
      semesterName: newSemName.trim(),
      gpaFour: Number(newGpa.toFixed(2)),
      cpaFour: computedCpa,
      gpaTen: gpaTen > 10 ? 10 : gpaTen,
      credits: newCredits,
      classification: gradeClass,
    };

    onUpdateSemesterHistory([...semesterHistory, newRecord]);
    setShowAddModal(false);
    setNewSemName('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Xóa kỳ học này khỏi biểu đồ quá trình?')) {
      onUpdateSemesterHistory(semesterHistory.filter(s => s.id !== id));
    }
  };

  // Custom modern tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1">
            {data.fullName}
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold">
            <span>GPA Học kỳ:</span>
            <span className="text-sm">{data.GPA} / 4.0</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-teal-300 font-semibold">
            <span>CPA Tích lũy:</span>
            <span>{data.CPA} / 4.0</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-amber-300 font-medium text-[11px]">
            <span>Hệ 10:</span>
            <span>{data['GPA Hệ 10']} / 10</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>Tín chỉ:</span>
            <span>{data.credits} tín ({data.classification})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Highest & lowest semester stats
  const highestSem = [...semesterHistory].sort((a, b) => b.gpaFour - a.gpaFour)[0];
  const lowestSem = [...semesterHistory].sort((a, b) => a.gpaFour - b.gpaFour)[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                Biểu Đồ Quá Trình Tích Lũy Điểm GPA / CPA Qua Từng Học Kỳ
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 hidden sm:inline-block">
                  Recharts Interactive
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi sự tiến bộ học tập, dự phóng xu hướng tốt nghiệp và duy trì học bổng
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setChartType('composed')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                chartType === 'composed'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Cột & Đường</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                chartType === 'line'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Đường Xu Hướng</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Kỳ Học
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
          <span className="text-slate-500 text-[11px] block">CPA Tích Lũy Hiện Tại</span>
          <span className="text-lg font-black text-emerald-800">
            {semesterHistory.length > 0 ? semesterHistory[semesterHistory.length - 1].cpaFour.toFixed(2) : currentSemesterGpa.toFixed(2)}
            <span className="text-xs font-normal text-emerald-600"> / 4.0</span>
          </span>
        </div>

        <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl">
          <span className="text-slate-500 text-[11px] block">Kỳ Điểm Cao Nhất 🏆</span>
          <span className="text-lg font-black text-teal-800">
            {highestSem ? `${highestSem.gpaFour} (${highestSem.semesterName.split('(')[0].trim()})` : 'Chưa có'}
          </span>
        </div>

        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
          <span className="text-slate-500 text-[11px] block">Tổng Tín Chỉ Tích Lũy</span>
          <span className="text-lg font-black text-indigo-900">
            {semesterHistory.reduce((acc, cur) => acc + cur.credits, 0)} <span className="text-xs font-normal text-indigo-600">tín</span>
          </span>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">Mục Tiêu Học Bổng</span>
            <span className="text-[10px] font-bold text-amber-700">GPA {targetGpa}</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="4.0"
            step="0.1"
            value={targetGpa}
            onChange={(e) => setTargetGpa(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'composed' ? (
            <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="cpaArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
                tickMargin={8}
              />
              <YAxis
                domain={[2.0, 4.0]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                ticks={[2.0, 2.5, 3.0, 3.2, 3.6, 4.0]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontWeight: 600 }}
              />

              {/* Target benchmark reference line */}
              <ReferenceLine
                y={targetGpa}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: `Mục tiêu (${targetGpa})`, fill: '#d97706', fontSize: 10, position: 'right' }}
              />
              {/* Honor distinction threshold */}
              <ReferenceLine
                y={3.6}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeOpacity={0.5}
                label={{ value: 'Chuẩn Xuất Sắc (3.6)', fill: '#059669', fontSize: 9, position: 'insideTopLeft' }}
              />

              <Area
                type="monotone"
                dataKey="CPA"
                name="CPA Tích Lũy"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#cpaArea)"
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
              />

              <Bar
                dataKey="GPA"
                name="GPA Học Kỳ"
                fill="url(#gpaGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={38}
              />

              <Line
                type="monotone"
                dataKey="GPA"
                name="Đường Xu Hướng GPA"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
                tickMargin={8}
              />
              <YAxis
                domain={[2.0, 4.0]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                ticks={[2.0, 2.5, 3.0, 3.2, 3.6, 4.0]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontWeight: 600 }}
              />

              <ReferenceLine
                y={targetGpa}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: `Mục tiêu (${targetGpa})`, fill: '#d97706', fontSize: 10, position: 'right' }}
              />

              <Line
                type="monotone"
                dataKey="GPA"
                name="GPA Học Kỳ"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />

              <Line
                type="monotone"
                dataKey="CPA"
                name="CPA Tích Lũy"
                stroke="#06b6d4"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Semester History Table Pills */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">Các học kỳ đã ghi nhận:</span>
          <span className="text-[11px] text-slate-400">Bấm biểu tượng thùng rác để xóa kỳ không mong muốn</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {semesterHistory.map((s) => (
            <div
              key={s.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 text-xs flex items-center justify-between gap-2 transition"
            >
              <div>
                <span className="font-bold text-slate-800">{s.semesterName}</span>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>GPA: <strong className="text-emerald-700">{s.gpaFour}</strong></span>
                  <span>•</span>
                  <span>CPA: <strong className="text-teal-700">{s.cpaFour}</strong></span>
                  <span>•</span>
                  <span>{s.credits} tín</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-slate-400 hover:text-rose-500 p-1 transition"
                title="Xóa kỳ học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Semester Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Thêm Học Kỳ Mới Vào Biểu Đồ
            </h4>

            <form onSubmit={handleAddSemester} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên học kỳ *</label>
                <input
                  type="text"
                  required
                  placeholder="Kỳ 2 (Năm 3), Kỳ Hè..."
                  value={newSemName}
                  onChange={(e) => setNewSemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm GPA thang 4</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="4.0"
                    required
                    value={newGpa}
                    onChange={(e) => setNewGpa(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số tín chỉ</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Lưu Vào Biểu Đồ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
