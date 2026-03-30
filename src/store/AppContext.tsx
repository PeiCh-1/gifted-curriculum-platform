import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, CourseSettings, IgpPlan, WeeklyPlan } from '../types';

interface AppContextType {
  state: AppState;
  setApiKey: (key: string) => void;
  setSettings: (settings: CourseSettings) => void;
  setLessonsA1: (lessons: WeeklyPlan[]) => void;
  setLessonsA2: (lessons: WeeklyPlan[]) => void;
  setIgpA1: (igp: IgpPlan) => void;
  setIgpA2: (igp: IgpPlan) => void;
}

const defaultState: AppState = {
  apiKey: '',
  settings: {
    academicYear: '',
    grade: '',
    materialSource: '',
    teacher: '',
    semester: '1',
    startDate: '',
    weeklyPeriods: 2,
    isTwoCourses: false,
    splitWeek: 10,
    courses: [
      { id: 'A1', name: '', courseType: '必修', mode: '', selectedDomains: [], selectedCoreCompetencies: [], description: '' }
    ]
  },
  lessonsA1: [],
  lessonsA2: [],
  igpA1: null,
  igpA2: null
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('giftedAppStorage');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('giftedAppStorage', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider value={{
      state,
      setApiKey: (apiKey) => updateState({ apiKey }),
      setSettings: (settings) => updateState({ settings }),
      setLessonsA1: (lessonsA1) => updateState({ lessonsA1 }),
      setLessonsA2: (lessonsA2) => updateState({ lessonsA2 }),
      setIgpA1: (igpA1) => updateState({ igpA1 }),
      setIgpA2: (igpA2) => updateState({ igpA2 })
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
