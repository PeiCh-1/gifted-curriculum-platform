export type CourseSettings = {
  academicYear: string;
  grade: string;
  materialSource: string;
  teacher: string;
  semester: string; // "1" 或 "2"
  startDate: string; // YYYY-MM-DD
  weeklyPeriods: number; // 每週節次
  isTwoCourses: boolean; 
  splitWeek?: number; // 開設雙課時，A1 課程上到第幾週
  courses: CourseInfo[]; // 1 or 2 courses depends on isTwoCourses
};

export type CourseInfo = {
  id: string; // 'A1' or 'A2'
  name: string; // 課程名稱 (自動組合)
  customName?: string; // 使用者自訂名稱
  courseType?: '必修' | '選修'; // 必修 或 選修
  mode: 'A' | 'B' | 'C' | 'D' | ''; // A:單一領域, B:相同領域跨科, C:不同領域跨科, D:特需融入學科
  selectedDomains: string[]; // ['國語文', '數學']
  selectedCoreCompetencies: string[]; // ['國-E-A1']
  description: string;
  courseGoals: string;
};

export type WeeklyPlan = {
  weekNumber: number;
  dateRange: string;
  courseId?: 'A1' | 'A2'; // 此週屬於哪門課程
  learningPerformances: string[]; // 選用的學習表現碼
  performanceAdjustments: Record<string, { adjusted: boolean, adjustedDesc: string }>;
  lessonFocus: string;
  assessmentMethods: string[];
  issues: string[];
  notes: string;
};

export type AppState = {
  apiKey: string;
  settings: CourseSettings;
  lessonsA1: WeeklyPlan[];
  lessonsA2: WeeklyPlan[];
  igpA1: IgpPlan | null;
  igpA2: IgpPlan | null;
};

export type IgpPlan = {
  studentStatus: string;
  adjustments: IgpAdjustment[];
  globalContentStrategy: string[];
  globalProcessStrategy: string[];
  globalEnvironmentStrategy: string[];
  globalAssessmentStrategy: string[];
};

export type IgpAdjustment = {
  indicatorCode: string; // e.g. '國1-II-1'
  originalDesc: string;
  adjustedDesc: string; // [+-] format
  contentStrategy: string[]; // 學習內容調整策略
  processStrategy: string[]; // 學習歷程調整策略
  environmentStrategy: string[]; // 學習環境調整策略
  assessmentStrategy: string[]; // 學習評量調整策略
};

export const officialIssues = [
  '性別平等教育', '人權教育', '環境教育', '海洋教育', '品德教育', 
  '生命教育', '法治教育', '科技教育', '資訊教育', '安全教育', 
  '防災教育', '原住民族教育', '多元文化教育', '閱讀素養教育', '家庭教育', 
  '生涯規劃教育', '能源教育', '媒體素養教育', '戶外教育'
];

export const assessmentOptions = ['口語評量', '實作評量', '紙筆測驗', '檔案評量', '觀察評量', '動態評量', '自我評量', '同儕評量'];

export const subjectOptions = [
  { group: '學科領域', items: ['數學領域', '語文領域/國語文', '自然領域', '社會領域', '專長領域/科技與資訊', '藝術領域'] },
  { group: '特需領域', items: ['特需領域/創造力', '特需領域/情意', '特需領域/領導', '特需領域/獨立研究'] }
];
