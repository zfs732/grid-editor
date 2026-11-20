import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useState } from 'react';

type Language = 'zh' | 'en';
type Preference = Language | 'auto';
const storageKey = 'grid-editor-language';

const english = {
  panels: 'Floating controls', fit: 'Fit grid to view',
  title: 'Grid Editor', workspace: 'Grid editor workspace', language: 'Interface language',
  followBrowser: 'Match browser', undo: 'Undo', redo: 'Redo', import: 'Import', export: 'Export',
  importFile: 'Import JSON file', tools: 'Drawing tools', draw: 'Draw', paint: 'Paint', erase: 'Erase',
  fill: 'Fill', fillForward: 'Fill ↘', directionHint: 'Fill down and right', pan: 'Pan',
  zoom: 'Canvas zoom', zoomOut: 'Zoom out', resetZoom: 'Reset zoom', zoomIn: 'Zoom in',
  properties: 'Canvas properties', color: 'Color', customColor: 'Custom color',
  presets: 'Color presets', grid: 'Grid', rows: 'Rows', cols: 'Cols', clear: 'Clear',
  canvas: (rows: number, cols: number) => `Drawing canvas, ${rows} rows by ${cols} columns`
};
const chinese: typeof english = {
  panels: '悬浮控件', fit: '适应画布',
  title: '网格编辑器', workspace: '网格编辑工作区', language: '界面语言', followBrowser: '跟随浏览器',
  undo: '撤销', redo: '重做', import: '导入', export: '导出', importFile: '导入 JSON 文件',
  tools: '绘图工具', draw: '画笔', paint: '涂色', erase: '橡皮', fill: '填充', fillForward: '定向填充',
  directionHint: '向右和向下填充', pan: '平移', zoom: '画布缩放', zoomOut: '缩小', resetZoom: '重置缩放',
  zoomIn: '放大', properties: '画布属性', color: '颜色', customColor: '自定义颜色', presets: '预设颜色',
  grid: '网格', rows: '行', cols: '列', clear: '清空',
  canvas: (rows, cols) => `${rows} 行 ${cols} 列绘图画布`
};

function readPreference(): Preference {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'zh' || value === 'en' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function browserLanguage(): Language {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of languages) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base === 'zh' || base === 'en') return base;
  }
  return 'en';
}

interface LanguageSettings {
  language: Language;
  preference: Preference;
  select: (value: Preference) => void;
  t: typeof english;
}

const LanguageContext = createContext<LanguageSettings | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState(readPreference);
  const [detected, setDetected] = useState(browserLanguage);
  const language = preference === 'auto' ? detected : preference;
  const t = language === 'zh' ? chinese : english;

  useLayoutEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = t.title;
  }, [language, t]);

  useEffect(() => {
    const detect = () => setDetected(browserLanguage());
    const syncPreference = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setPreference(readPreference());
    };
    window.addEventListener('languagechange', detect);
    window.addEventListener('storage', syncPreference);
    return () => {
      window.removeEventListener('languagechange', detect);
      window.removeEventListener('storage', syncPreference);
    };
  }, []);

  function select(value: Preference) {
    setPreference(value);
    try {
      if (value === 'auto') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    } catch {
      // The current tab still honors the selection when storage is unavailable.
    }
  }

  return <LanguageContext.Provider value={{ language, preference, select, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const settings = useContext(LanguageContext);
  if (!settings) throw new Error('LanguageProvider is required.');
  return settings;
}
