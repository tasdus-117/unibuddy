import React, { useState, useEffect } from 'react';
import { CourseGrade, SemesterGpaRecord } from '../types';
import { calculateCourseFinal, calculateCumulativeGpa, calculateRequiredFinalExam } from '../utils/academicUtils';
import { INITIAL_SEMESTER_HISTORY } from '../data/sampleData';
import { GpaTrendChart } from './GpaTrendChart';
import { Award, Plus, Trash2, Calculator, TrendingUp, HelpCircle, Check, Info, BarChart2 } from 'lucide-react';

interface Props {
  courses: CourseGrade[];
  onUpdateCourses: (newCourses: CourseGrade[]) => void;
  semesterHistory?: SemesterGpaRecord[];
  onUpdateSemesterHistory?: (newHistory: SemesterGpaRecord[]) => void;
}

export const GpaCalculator: React.FC<Props> = ({
  courses,
  onUpdateCourses,
  semesterHistory: propSemesterHistory,
  onUpdateSemesterHistory: propOnUpdateSemesterHistory,
}) => {
  // Semester history state
  const [localHistory, setLocalHistory] = useState<SemesterGpaRecord[]>(() => {
    const saved = localStorage.getItem('unibuddy_semester_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return localStorage.getItem('unibuddy_initial_setup_done') === 'true' ? [] : INITIAL_SEMESTER_HISTORY;
  });

  const history = propSemesterHistory || localHistory;
  const updateHistory = (newHistory: SemesterGpaRecord[]) => {
    if (propOnUpdateSemesterHistory) {
      propOnUpdateSemesterHistory(newHistory);
    } else {
      setLocalHistory(newHistory);
      localStorage.setItem('unibuddy_semester_history', JSON.stringify(newHistory));
    }
  };

  // Target calculator states
  const [calcAtt, setCalcAtt] = useState<number>(9.0);
  const [calcMid, setCalcMid] = useState<number>(8.0);
  const [calcAttWeight, setCalcAttWeight] = useState<number>(0.1);
  const [calcMidWeight, setCalcMidWeight] = useState<number>(0.3);
  const [calcFinalWeight, setCalcFinalWeight] = useState<number>(0.6);
  const [calcTargetLetter, setCalcTargetLetter] = useState<string>('A');

  // New course modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newAtt, setNewAtt] = useState<number>(10);
  const [newMid, setNewMid] = useState<number>(8.5);
  const [newFin, setNewFin] = useState<number>(8.0);
  const [newAttW, setNewAttW] = useState<number>(0.1);
  const [newMidW, setNewMidW] = useState<number>(0.3);
  const [newFinW, setNewFinW] = useState<number>(0.6);

  const { gpaFour, gpaTen, totalCredits, classification } = calculateCumulativeGpa(courses);

  const targetResult = calculateRequiredFinalExam(
    calcAtt,
    calcMid,
    calcAttWeight,
    calcMidWeight,
    calcFinalWeight,
    calcTargetLetter
  );

  const handleDelete = (id: string) => {
    onUpdateCourses(courses.filter((c) => c.id !== id));
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const newCourse: CourseGrade = {
      id: `c-${Date.now()}`,
      name: newCourseName,
      credits: newCredits,
      attendanceScore: newAtt,
      midtermScore: newMid,
      finalScore: newFin,
      attendanceWeight: newAttW,
      midtermWeight: newMidW,
      finalWeight: newFinW,
    };

    onUpdateCourses([...courses, newCourse]);
    setIsModalOpen(false);
    setNewCourseName('');
  };

  const updateCourseScore = (
    id: string,
    field: 'attendanceScore' | 'midtermScore' | 'finalScore',
    value: number
  ) => {
    onUpdateCourses(
      courses.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* GPA Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* GPA Four scale */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-100">
            <span>GPA Thang 4 (Tín chỉ)</span>
            <Award className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-3xl font-extrabold mt-1 text-white">
            {gpaFour.toFixed(2)} <span className="text-sm font-normal text-emerald-100">/ 4.0</span>
          </div>
          <div className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 inline-block">
            Xếp loại: {classification}
          </div>
        </div>

        {/* GPA Ten scale */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Điểm Hệ 10 Tích Lũy</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold mt-1 text-slate-900">
            {gpaTen.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Dùng xét học bổng khuyến khích</p>
        </div>

        {/* Total Credits */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng Số Tín Chỉ</span>
            <Info className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold mt-1 text-slate-900">
            {totalCredits} <span className="text-sm font-normal text-slate-400">tín</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Đã đăng ký trong kỳ này</p>
        </div>

        {/* Degree Forecast */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Dự Báo Tốt Nghiệp</span>
            <span className="text-xs font-bold text-amber-500">🎓 Chuẩn ĐH</span>
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-700 truncate">
            {classification === 'Xuất sắc' ? 'Bằng Xuất Sắc 🏆' : classification === 'Giỏi' ? 'Bằng Giỏi ⭐' : classification === 'Khá' ? 'Bằng Khá 👍' : 'Cần Nỗ Lực Thêm'}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {gpaFour >= 3.2 ? 'Đủ điều kiện xét học bổng kỳ tới' : 'Cố gắng cải thiện các môn C, D'}
          </p>
        </div>
      </div>

      {/* Recharts GPA Trend Chart */}
      <GpaTrendChart
        semesterHistory={history}
        onUpdateSemesterHistory={updateHistory}
        currentSemesterGpa={gpaFour}
      />

      {/* Interactive Tool: Calculate Required Final Exam Score */}
      <div className="bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-indigo-950 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Công Cụ: Tính Điểm Thi Cuối Kỳ Cần Đạt Để Qua Môn Hoặc Đạt Điểm A
            </h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              Nhập điểm quá trình (chuyên cần, giữa kỳ) để biết chính xác điểm thi bạn cần làm được!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chuyên cần (10%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={calcAtt}
              onChange={(e) => setCalcAtt(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Giữa kỳ (30%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={calcMid}
              onChange={(e) => setCalcMid(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tỷ lệ thi cuối kỳ</label>
            <select
              value={calcFinalWeight}
              onChange={(e) => {
                const fw = Number(e.target.value);
                setCalcFinalWeight(fw);
                if (fw === 0.6) {
                  setCalcAttWeight(0.1);
                  setCalcMidWeight(0.3);
                } else if (fw === 0.5) {
                  setCalcAttWeight(0.1);
                  setCalcMidWeight(0.4);
                } else if (fw === 0.7) {
                  setCalcAttWeight(0.1);
                  setCalcMidWeight(0.2);
                }
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
            >
              <option value="0.6">60% (Chuẩn phổ biến)</option>
              <option value="0.5">50%</option>
              <option value="0.7">70%</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mục tiêu điểm chữ</label>
            <select
              value={calcTargetLetter}
              onChange={(e) => setCalcTargetLetter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="A">Điểm A (từ 8.5 trở lên) - Xuất sắc</option>
              <option value="B+">Điểm B+ (từ 8.0 - 8.4) - Khá giỏi</option>
              <option value="B">Điểm B (từ 7.0 - 7.9) - Khá</option>
              <option value="C+">Điểm C+ (từ 6.5 - 6.9) - TB khá</option>
              <option value="C">Điểm C (từ 5.5 - 6.4) - Qua môn</option>
              <option value="D">Điểm D (từ 4.0 - 5.4) - Vớt qua môn</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
            <div className={`p-2 rounded-xl text-center font-bold ${
              targetResult.isAchievable
                ? targetResult.requiredScore <= 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                : 'bg-rose-100 text-rose-800'
            }`}>
              <div className="text-[10px] uppercase font-semibold">Cần thi tối thiểu</div>
              <div className="text-base font-extrabold">{targetResult.requiredScore} điểm</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-indigo-900 font-medium mt-2 bg-white/70 p-2 rounded-xl border border-indigo-100">
          💡 <strong>Kết quả:</strong> {targetResult.message}
        </p>
      </div>

      {/* Courses Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Bảng Môn Học & Tính Điểm Học Phần Kỳ Này
            </h3>
            <p className="text-xs text-slate-500">
              Bạn có thể tự do điều chỉnh điểm số để xem GPA thay đổi theo thời gian thực
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm Môn Tính Điểm
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
              <tr>
                <th className="py-3 px-3">Tên Môn Học</th>
                <th className="py-3 px-2 text-center">Số Tín</th>
                <th className="py-3 px-2 text-center">Chuyên Cần (10%)</th>
                <th className="py-3 px-2 text-center">Giữa Kỳ (30%)</th>
                <th className="py-3 px-2 text-center">Cuối Kỳ (60%)</th>
                <th className="py-3 px-2 text-center">Tổng Hệ 10</th>
                <th className="py-3 px-2 text-center">Điểm Chữ</th>
                <th className="py-3 px-2 text-center">Thang 4</th>
                <th className="py-3 px-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-xs text-slate-500">
                    Chưa có môn học nào trong bảng tính điểm. Nhấn{' '}
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      + Thêm Môn Tính Điểm
                    </button>{' '}
                    để bắt đầu tính GPA kỳ này!
                  </td>
                </tr>
              ) : (
                courses.map((c) => {
                  const { finalTen, letter, fourScale } = calculateCourseFinal(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {c.name}
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-600">
                        {c.credits}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={c.attendanceScore ?? 10}
                          onChange={(e) => updateCourseScore(c.id, 'attendanceScore', Number(e.target.value))}
                          className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={c.midtermScore ?? 8}
                          onChange={(e) => updateCourseScore(c.id, 'midtermScore', Number(e.target.value))}
                          className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={c.finalScore ?? 8}
                          onChange={(e) => updateCourseScore(c.id, 'finalScore', Number(e.target.value))}
                          className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white"
                        />
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-900">
                        {finalTen.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                          letter === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          letter === 'B+' || letter === 'B' ? 'bg-teal-100 text-teal-800' :
                          letter === 'C+' || letter === 'C' ? 'bg-amber-100 text-amber-800' :
                          letter === 'D+' || letter === 'D' ? 'bg-orange-100 text-orange-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {letter}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-extrabold text-slate-800">
                        {fourScale.toFixed(1)}
                      </td>

                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition"
                          title="Xóa môn này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Thêm Môn Học Mới
            </h3>

            <form onSubmit={handleAddCourse} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học *</label>
                <input
                  type="text"
                  required
                  placeholder="Kinh tế lượng, Tiếng Anh 2, Xác suất thống kê..."
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tín chỉ</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên cần</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={newAtt}
                    onChange={(e) => setNewAtt(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giữa kỳ</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={newMid}
                    onChange={(e) => setNewMid(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cuối kỳ</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={newFin}
                    onChange={(e) => setNewFin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
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
                  Thêm vào bảng điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
