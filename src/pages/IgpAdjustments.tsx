import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Activity, Wand2, Download, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { IgpAdjustment, IgpPlan } from '../types';
import learningPerformancesData from '../data/learning_performances.json';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exportIgpToWord } from '../utils/wordExport';

export default function IgpAdjustments() {
  const { state, setIgpA1, setIgpA2 } = useAppContext();
  const { settings, apiKey, lessonsA1, lessonsA2, igpA1, igpA2 } = state;
  const [activeCourseId, setActiveCourseId] = useState<'A1'|'A2'>('A1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeLessons = activeCourseId === 'A1' ? lessonsA1 : lessonsA2;
  const activeIgp = activeCourseId === 'A1' ? igpA1 : igpA2;
  const setActiveIgp = activeCourseId === 'A1' ? setIgpA1 : setIgpA2;
  const currentCourseSettings = settings.courses.find(c => c.id === activeCourseId);

  // Derive unique indicators from curriculum plan
  const deduplicatedCodes = Array.from(new Set(
    activeLessons.flatMap(lesson => lesson.learningPerformances)
  ));

  const deduplicatedIndicators = deduplicatedCodes.map(code => {
    // 優先從週次計畫中尋找該指標是否有「調整後描述 (adjustedDesc)」
    let adjustedContent = '';
    for (const lesson of activeLessons) {
      const adj = lesson.performanceAdjustments?.[code];
      if (adj?.adjusted && adj.adjustedDesc) {
        adjustedContent = adj.adjustedDesc;
        break; // 找到第一個調整過的版本就以此為準
      }
    }

    if (adjustedContent) {
      return { code, content: adjustedContent, isAlreadyAdjusted: true };
    }

    // 若無調整，則從原始指標庫尋找
    const original = learningPerformancesData.find((d: any) => d.code === code);
    return original ? { ...original, isAlreadyAdjusted: false } : { code, content: '未知指標', isAlreadyAdjusted: false };
  });

  // Initialize IGP state if null
  useEffect(() => {
    if (!activeIgp) {
      setActiveIgp({
        studentStatus: '',
        adjustments: [],
        globalContentStrategy: [],
        globalProcessStrategy: [],
        globalEnvironmentStrategy: [],
        globalAssessmentStrategy: []
      });
    }
  }, [activeIgp, setActiveIgp]);

  const handleStatusChange = (status: string) => {
    if (!activeIgp) return;
    setActiveIgp({ ...activeIgp, studentStatus: status });
  };

  const handleAdjustmentChange = (index: number, field: keyof IgpAdjustment, value: any) => {
    if (!activeIgp) return;
    const newAdjs = [...activeIgp.adjustments];
    newAdjs[index] = { ...newAdjs[index], [field]: value };
    setActiveIgp({ ...activeIgp, adjustments: newAdjs });
  };

  const handleGlobalStrategyToggle = (stratType: 'globalContentStrategy'|'globalProcessStrategy'|'globalEnvironmentStrategy'|'globalAssessmentStrategy', value: string) => {
    if (!activeIgp) return;
    let arr = [...activeIgp[stratType] || []];
    if (arr.includes(value)) arr = arr.filter(v => v !== value);
    else arr.push(value);
    setActiveIgp({ ...activeIgp, [stratType]: arr });
  };

  const generateIgpWithAI = async () => {
    if (!apiKey) {
      setErrorMsg('請先至基本設定填寫 Gemini API 密鑰！');
      return;
    }
    if (deduplicatedIndicators.length === 0) {
      setErrorMsg('該課程尚未在「課程規劃」挑選任何學習表現指標，請先完成課程規劃！');
      return;
    }
    if (!activeIgp?.studentStatus) {
      setErrorMsg('請先填寫學生的狀況描述！');
      return;
    }
    
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const indicatorsText = deduplicatedIndicators.map(ind => `[${ind.code}] ${ind.content}`).join('\n');

      const prompt = `您是一位特殊教育與資優教育專家。現在需要為一位持有 IGP 的學生進行「資優課程調整方式」的差異化設計。

【學生狀態與調整需求】
${activeIgp.studentStatus}

【原始學習表現指標】
只能從以下挑選：
${indicatorsText}

【改寫原則】
1. 【非常重要】：您『只能挑選 3 到 6 項』與該名學生最切身的指標進行改寫，不要全部改寫！其餘不相關請直接省略。
2. 改寫方式：【絕對禁止整句替換】！必須以原始指標內容作為主體（保留 80% 以上文字），增加的文字以 [+增加的字+] 包起來，刪除的文字以 [-刪除的字-] 包起來。
3. 同時為每個已挑選的指標，根據學生狀態，從以下四面向各挑選最少 1 項（最多 3 項）最適合的調整策略：
  學習內容調整策略：重組, 加深, 加廣, 濃縮, 加速, 跨領域/科目統整教學主題
  學習歷程調整策略：高層次思考, 開放式問題, 發現式學習, 推理的證據, 選擇的自由, 團體式的互動, 彈性的教學進度, 多樣性的歷程
  學習環境調整策略：調整物理的學習環境, 營造社會-情緒的學習環境, 規劃有回應的學習環境, 有挑戰性的學習環境, 調查與運用社區資源
  學習評量調整策略：發展合適的評量工具, 訂定區分性的評量標準, 呈現多元的實作與作品

請只回傳陣列 JSON（不需要 markdown 標籤，嚴格回傳字串），包含物件結構如下：
[
  {
    "indicatorCode": "原始指標代碼",
    "adjustedDesc": "能[+運用教具+]了解分數[-概念-]",
    "contentStrategy": ["加深"],
    "processStrategy": ["高層次思考"],
    "environmentStrategy": ["調整物理的學習環境"],
    "assessmentStrategy": ["呈現多元的實作與作品"]
  }
]`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
      }

      const generatedPlan = JSON.parse(responseText);

      const mappedAdjustments: IgpAdjustment[] = generatedPlan.map((gen: any) => ({
        indicatorCode: gen.indicatorCode,
        originalDesc: deduplicatedIndicators.find((d:any)=>d.code === gen.indicatorCode)?.content || '',
        adjustedDesc: gen.adjustedDesc || '',
        contentStrategy: [], processStrategy: [], environmentStrategy: [], assessmentStrategy: []
      }));

      const globalContent = Array.from(new Set(generatedPlan.flatMap((g:any) => g.contentStrategy || []))) as string[];
      const globalProcess = Array.from(new Set(generatedPlan.flatMap((g:any) => g.processStrategy || []))) as string[];
      const globalEnv = Array.from(new Set(generatedPlan.flatMap((g:any) => g.environmentStrategy || []))) as string[];
      const globalAssess = Array.from(new Set(generatedPlan.flatMap((g:any) => g.assessmentStrategy || []))) as string[];

      setActiveIgp({ 
        ...activeIgp, 
        adjustments: mappedAdjustments,
        globalContentStrategy: globalContent,
        globalProcessStrategy: globalProcess,
        globalEnvironmentStrategy: globalEnv,
        globalAssessmentStrategy: globalAssess
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg('生成失敗，請確認 API Key 是否正確及學生狀態描述。' + (err.message || ''));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderAdjustedHtml = (text: string) => {
    return {
      __html: text
        .replace(/\[\+([^\]]+)\+\]/g, '<span class="text-emerald-700 font-bold bg-emerald-100 px-1 rounded mx-0.5">+$1</span>')
        .replace(/\[\-([^\]]+)\-\]/g, '<span class="text-red-500 bg-red-100 line-through px-1 rounded mx-0.5">-$1</span>')
    };
  };

  if (!activeIgp) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            <Activity className="text-fuchsia-600" /> IGP 個別調整
          </h1>
          <p className="text-gray-500 mt-1">針對個別學生需求，由 AI 協助篩選並改寫適用指標，擬定四大面向調整策略。</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {settings.isTwoCourses && (
            <div className="flex p-1 bg-gray-200/50 rounded-lg mr-2">
              <button 
                className={`px-4 py-2 rounded-md font-bold transition-all ${activeCourseId === 'A1' ? 'bg-white shadow text-fuchsia-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveCourseId('A1')}
              >
                A1 課程 IGP
              </button>
              <button 
                className={`px-4 py-2 rounded-md font-bold transition-all ${activeCourseId === 'A2' ? 'bg-white shadow text-fuchsia-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveCourseId('A2')}
              >
                A2 課程 IGP
              </button>
            </div>
          )}

          <button onClick={() => exportIgpToWord(state, activeCourseId)} className="btn-secondary flex items-center gap-2 text-fuchsia-700 border-fuchsia-200 hover:border-fuchsia-400 font-medium">
            <FileText size={18} /> 一鍵匯出 Word 檔
          </button>

          <button 
            onClick={generateIgpWithAI} 
            disabled={isGenerating}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)' }}
          >
            <div className="flex items-center gap-2 font-bold shadow-lg">
              {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {isGenerating ? 'AI 調適中...' : 'AI 自動調整課程'}
            </div>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 animate-fade-in">
          <AlertCircle />
          {errorMsg}
        </div>
      )}

      <div className="glass p-6 rounded-2xl border-l-4 border-l-fuchsia-500">
        <h2 className="text-xl font-bold mb-4">1. 自動匯入課程學習表現 ({deduplicatedCodes.length} 項)</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {deduplicatedCodes.length === 0 ? (
            <div className="text-gray-400 italic">尚無指標，請先在課程規劃中生成或挑選。</div>
          ) : (
            deduplicatedCodes.map(code => (
              <span key={code} className="px-2 py-1 bg-gray-100 border border-gray-200 text-sm rounded-md text-gray-700">{code}</span>
            ))
          )}
        </div>

        <div className="form-group mt-6">
          <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
            2. 學生狀態與調整需求
            <span className="text-sm font-normal text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded">Required</span>
          </label>
          <textarea 
            rows={3} 
            placeholder="請描述學生的學習特質或困難，AI 將根據描述從上方清單挑選最合適的 3-6 項指標進行改寫，並設計這學期的 IGP 調整策略... (例如：該生對於文字閱讀較慢，但視覺觀察力極強)" 
            value={activeIgp.studentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-lg"
          />
        </div>
      </div>

      {activeIgp.adjustments.length > 0 && (
        <div className="space-y-6 animate-fade-in mt-8">
          
          <div className="glass p-6 rounded-2xl relative overflow-hidden group hover:shadow-xl transition-shadow">
            <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-400"></div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="bg-fuchsia-100 text-fuchsia-700 px-3 py-1 rounded-lg text-lg">ALL</span>
              課程所有學習表現指標彙整
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {activeIgp.adjustments.map((adj, index) => (
                <div key={index} className="bg-white/70 p-4 rounded-xl border border-gray-100 relative">
                  <div className="inline-block bg-fuchsia-100 text-fuchsia-800 font-bold px-3 py-1 rounded-lg mb-3">
                    {adj.indicatorCode}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-1 font-bold">【原始指標】</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 h-full">{adj.originalDesc}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1 font-bold">【改寫後指標】</div>
                      <div className="text-base font-medium text-gray-800 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 h-full leading-relaxed" dangerouslySetInnerHTML={renderAdjustedHtml(adj.adjustedDesc)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-2xl border-2 border-indigo-100 bg-white">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-indigo-100 pb-4">
              ✨ 整門課程之綜合調整策略勾選
            </h2>
            
            <div className="grid grid-cols-1 gap-5">
              {[
                { id: 'globalContentStrategy', title: '內容', color: 'text-blue-600', opts: ['重組', '加深', '加廣', '濃縮', '加速', '跨領域/科目統整教學主題', '其他:'] },
                { id: 'globalProcessStrategy', title: '歷程', color: 'text-emerald-600', opts: ['高層次思考', '開放式問題', '發現式學習', '推理的證據', '選擇的自由', '團體式的互動', '彈性的教學進度', '多樣性的歷程', '其他：'] },
                { id: 'globalEnvironmentStrategy', title: '環境', color: 'text-amber-600', opts: ['調整物理的學習環境', '營造社會-情緒的學習環境', '規劃有回應的學習環境', '有挑戰性的學習環境', '調查與運用社區資源', '其他'] },
                { id: 'globalAssessmentStrategy', title: '評量', color: 'text-rose-600', opts: ['發展合適的評量工具', '訂定區分性的評量標準', '呈現多元的實作與作品', '其他：'] }
              ].map(sec => (
                <div key={sec.title} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <div className={`font-bold text-base ${sec.color} sm:w-16 pt-0.5 flex-shrink-0`}>{sec.title}調整</div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {sec.opts.map(opt => (
                      <label 
                        key={opt} 
                        className="inline-flex items-start gap-1.5 text-sm cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                      >
                        <input 
                          type="checkbox"
                          className="flex-shrink-0 w-4 h-4 mt-0.5 rounded text-indigo-500 cursor-pointer"
                          checked={((activeIgp as any)[sec.id] || []).includes(opt)}
                          onChange={() => handleGlobalStrategyToggle(sec.id as any, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
