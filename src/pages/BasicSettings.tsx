import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { KeyRound, Settings2, BookOpen, User, CalendarDays, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import coreCompetenciesData from '../data/core_competencies.json';
import { subjectOptions } from '../types';

export default function BasicSettings() {
  const { state, setApiKey, setSettings } = useAppContext();
  const { apiKey, settings } = state;
  const navigate = useNavigate();

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleModeChange = (courseIndex: number, newMode: any) => {
    const updatedCourses = [...settings.courses];
    updatedCourses[courseIndex] = {
      ...updatedCourses[courseIndex],
      mode: newMode,
      selectedDomains: [],
      selectedCoreCompetencies: [],
      name: ''
    };
    setSettings({ ...settings, courses: updatedCourses });
  };

  const handleDomainToggle = (courseIndex: number, domain: string) => {
    const course = settings.courses[courseIndex];
    let newDomains = [...course.selectedDomains];
    
    // Logic based on mode
    if (course.mode === 'A') {
      newDomains = [domain]; // Only one
    } else {
      if (newDomains.includes(domain)) {
        newDomains = newDomains.filter(d => d !== domain);
      } else {
        newDomains.push(domain);
      }
    }

    // Auto generate course name
    let newName = '';
    const isSpecial = (d: string) => d.includes('特需領域');
    const isAcademic = (d: string) => d.includes('領域') && !isSpecial(d);

    if (course.mode === 'A' && newDomains.length === 1) {
      newName = newDomains[0];
    } else if (course.mode === 'B') {
      newName = `跨科(${newDomains.join('、')})`;
    } else if (course.mode === 'C') {
      newName = `跨科(${newDomains.join('、')})`;
    } else if (course.mode === 'D') {
      const special = newDomains.filter(isSpecial).join('、');
      const academic = newDomains.filter(isAcademic).join('、');
      if (special && academic) {
        newName = `${special}融入${academic}`;
      }
    }

    const updatedCourses = [...settings.courses];
    updatedCourses[courseIndex] = {
      ...course,
      selectedDomains: newDomains,
      name: newName,
      // Reset core competencies if domains change significantly
      selectedCoreCompetencies: course.selectedCoreCompetencies.filter(cc => {
        const competency = coreCompetenciesData.find((c: any) => c.code === cc);
        return competency && newDomains.includes(competency.domainName);
      })
    };
    setSettings({ ...settings, courses: updatedCourses });
  };

  const toggleTwoCourses = () => {
    const isTwo = !settings.isTwoCourses;
    const newCourses = [...settings.courses];
    if (isTwo && newCourses.length === 1) {
      newCourses.push({ id: 'A2', name: '', mode: '', selectedDomains: [], selectedCoreCompetencies: [], description: '', courseGoals: '' });
    } else if (!isTwo && newCourses.length === 2) {
      newCourses.pop();
    }
    setSettings({ ...settings, isTwoCourses: isTwo, courses: newCourses });
  };

  const getAvailableCompetencies = (selectedDomains: string[]) => {
    return coreCompetenciesData.filter((c: any) => selectedDomains.includes(c.domainName));
  };

  const toggleCompetency = (courseIndex: number, code: string) => {
    const course = settings.courses[courseIndex];
    let newComps = [...course.selectedCoreCompetencies];
    if (newComps.includes(code)) {
      newComps = newComps.filter(c => c !== code);
    } else {
      newComps.push(code);
    }
    const updatedCourses = [...settings.courses];
    updatedCourses[courseIndex] = { ...course, selectedCoreCompetencies: newComps };
    setSettings({ ...settings, courses: updatedCourses });
  };

  const updateCourseDesc = (courseIndex: number, desc: string) => {
    const updatedCourses = [...settings.courses];
    updatedCourses[courseIndex] = { ...updatedCourses[courseIndex], description: desc };
    setSettings({ ...settings, courses: updatedCourses });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            <Settings2 className="text-indigo-600" /> 基本設定
          </h1>
          <p className="text-gray-500 mt-1">設定您的 API 金鑰與課程基本資訊，以便進行後續的 AI 輔助規劃。</p>
        </div>
        <button 
          onClick={() => navigate('/planning')}
          className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
        >
          前往課程計畫 <ArrowRight size={20} />
        </button>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
          <KeyRound className="text-emerald-500" /> API 設定
        </h2>
        <div className="form-group">
          <label>Gemini API 金鑰</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={handleApiKeyChange}
            placeholder="請輸入您的 Gemini API Key..."
            className="font-mono"
          />
          <div className="form-hint">您的金鑰僅會保存在此瀏覽器的 LocalStorage 中，不會上傳至任何伺服器。</div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
          <BookOpen className="text-blue-500" /> 課程基本資訊
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="form-group">
            <label>授課學年度</label>
            <input 
              type="text" 
              placeholder="例如: 114" 
              value={settings.academicYear}
              onChange={(e) => handleSettingChange('academicYear', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>對象年級</label>
            <select 
              value={settings.grade}
              onChange={(e) => handleSettingChange('grade', e.target.value)}
            >
              <option value="">請選擇</option>
              {['一', '二', '三', '四', '五', '六'].map(g => (
                <option key={g} value={g}>{g}年級</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>開課學期</label>
            <select 
              value={settings.semester}
              onChange={(e) => handleSettingChange('semester', e.target.value)}
            >
              <option value="1">上學期</option>
              <option value="2">下學期</option>
            </select>
          </div>
          <div className="form-group">
            <label>開學日期 (該週週一)</label>
            <input 
              type="date" 
              value={settings.startDate}
              onChange={(e) => handleSettingChange('startDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>教學者</label>
            <input 
              type="text" 
              value={settings.teacher}
              onChange={(e) => handleSettingChange('teacher', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>教材來源</label>
            <input 
              type="text" 
              placeholder="例如: 自編教材" 
              value={settings.materialSource}
              onChange={(e) => handleSettingChange('materialSource', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>每週節次</label>
            <input 
              type="number" 
              min={1} max={10}
              placeholder="例如: 2" 
              value={settings.weeklyPeriods ?? 2}
              onChange={(e) => handleSettingChange('weeklyPeriods', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-indigo-900">學期中是否開設兩門獨立課程？</div>
            <div className="text-sm text-indigo-700">若勾選，將分為 A1 與 A2 兩區填寫課程資訊。</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.isTwoCourses} onChange={toggleTwoCourses} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {settings.isTwoCourses && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 animate-fade-in">
            <div className="font-bold text-amber-900 mb-2">A1 課程授課至第幾週？</div>
            <div className="text-sm text-amber-700 mb-3">
              一學期共 {settings.semester === '1' ? '21' : '20'} 週。請設定 A1 課程負責的週次範圍，A2 將自動接轉剩餘週次。
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-amber-900 bg-blue-100 px-3 py-1 rounded-lg">A1：第 1 週</span>
              <span className="text-amber-600 font-bold">～</span>
              <input
                type="number"
                min={1}
                max={(settings.semester === '1' ? 21 : 20) - 1}
                className="w-20 border-amber-300 border rounded-md p-2 text-center font-bold text-amber-900 bg-white"
                value={settings.splitWeek ?? 10}
                onChange={(e) => handleSettingChange('splitWeek', Number(e.target.value))}
              />
              <span className="text-sm font-bold text-amber-900">週</span>
              <span className="mx-2 text-gray-400">｜</span>
              <span className="text-sm font-bold text-orange-900 bg-orange-100 px-3 py-1 rounded-lg">
                A2：第 {(settings.splitWeek ?? 10) + 1} 週 ～ 第 {settings.semester === '1' ? '21' : '20'} 週
              </span>
            </div>
          </div>
        )}
      </div>


      {settings.courses.map((course, index) => (
        <div key={course.id} className="glass p-8 rounded-2xl relative animate-fade-in border-l-4 border-l-indigo-500">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 rounded-bl-xl font-bold tracking-wider rounded-tr-xl">
            {course.id} 課程設定
          </div>
          
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="text-indigo-500" /> 
            預設組合名稱：<span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 text-sm font-normal">{course.name || '尚未產生'}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group mb-0">
              <label className="block font-bold mb-2 text-gray-700">自訂課程名稱 (顯示於 Word 等最終文件)</label>
              <input 
                type="text" 
                placeholder={`若不自定，則預設為: ${course.name || '尚未產生'}`}
                value={course.customName || ''}
                onChange={(e) => {
                  const updatedCourses = [...settings.courses];
                  updatedCourses[index] = { ...course, customName: e.target.value };
                  setSettings({ ...settings, courses: updatedCourses });
                }}
                className="font-bold text-lg text-indigo-900 border-indigo-200 focus:border-indigo-500 bg-white/70 w-full"
              />
            </div>
            <div className="form-group mb-0">
              <label className="block font-bold mb-2 text-gray-700">課程類型 (必選修)</label>
              <select 
                value={course.courseType || '必修'}
                onChange={(e) => {
                  const updatedCourses = [...settings.courses];
                  updatedCourses[index] = { ...course, courseType: e.target.value as '必修' | '選修' };
                  setSettings({ ...settings, courses: updatedCourses });
                }}
                className="font-bold text-lg text-indigo-900 border-indigo-200 focus:border-indigo-500 bg-white/70 w-full"
              >
                <option value="必修">必修</option>
                <option value="選修">選修</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-bold mb-3 text-gray-700">1. 請選擇課程模式：</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { val: 'A', label: '單一領域/科目 (只能勾選一個)' },
                { val: 'B', label: '相同領域跨科 (特需任兩個以上)' },
                { val: 'C', label: '不同領域跨科 (任意兩個領域以上)' },
                { val: 'D', label: '特需融入學科 (學科主+特需輔)' }
              ].map(opt => (
                <label 
                  key={opt.val} 
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    course.mode === opt.val ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name={`mode-${course.id}`} 
                    value={opt.val} 
                    checked={course.mode === opt.val}
                    onChange={() => handleModeChange(index, opt.val)}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6 bg-white/50 p-6 rounded-xl border border-gray-100">
            <label className="block font-bold mb-4 text-gray-700">2. 勾選領域/科目</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {subjectOptions.map(group => (
                <div key={group.group}>
                  <div className="font-bold text-gray-500 mb-3 pb-2 border-b border-gray-200">{group.group}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(subj => {
                      const isSelected = course.selectedDomains.includes(subj);
                      return (
                        <button
                          key={subj}
                          onClick={() => handleDomainToggle(index, subj)}
                          disabled={!course.mode}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {subj.replace('領域/','').replace('領域','')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {!course.mode && <div className="text-red-500 text-sm mt-3 font-medium">請先選擇課程模式才能勾選科目。</div>}
          </div>

          <div className="mb-6">
            <label className="block font-bold mb-3 text-gray-700">3. 核心領綱素養 (根據選擇的領域自動帶出)</label>
            {course.selectedDomains.length === 0 ? (
              <div className="text-gray-400 italic bg-gray-50 p-4 rounded-lg text-center">請先勾選上方的領域/科目。</div>
            ) : (
              <div className="grid gap-3 bg-white/50 p-4 rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
                {getAvailableCompetencies(course.selectedDomains).map((comp: any) => (
                  <label key={comp.code} className="flex items-start gap-3 p-3 hover:bg-indigo-50/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-indigo-600 rounded"
                      checked={course.selectedCoreCompetencies.includes(comp.code)}
                      onChange={() => toggleCompetency(index, comp.code)}
                    />
                    <div>
                      <div className="font-bold text-indigo-900">{comp.code}</div>
                      <div className="text-sm text-gray-700 leading-relaxed">{comp.content}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="block font-bold mb-2 text-gray-700">4. 課程簡易描述 (提供給 AI 參考)</label>
            <textarea 
              rows={3} 
              placeholder="請簡述這門課的主題、教學目標或大方向，AI 將依此幫您產出每週教學重點... (例如：本課程將帶領學生透過撲克牌認識數學規律)" 
              value={course.description}
              onChange={(e) => updateCourseDesc(index, e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
