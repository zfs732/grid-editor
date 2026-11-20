import { useLanguage } from '../language';
import { ChangeEvent, CSSProperties, useEffect, useRef } from 'react';
import { GridMode, useGridMode, useGridStore, useGridZoom, ZOOM_LIMITS } from '../state/gridStore';
import Icon from './Icon';
import LanguagePicker from './LanguagePicker';

const modes: { id: GridMode; key: string }[] = [
  { id: 'draw', key: 'B' },
  { id: 'paint', key: 'P' },
  { id: 'erase', key: 'E' },
  { id: 'fill', key: 'F' },
  { id: 'fillForward', key: 'G' },
  { id: 'pan', key: 'Space' }
];

export function TopBar({ panelsVisible, togglePanels }: { panelsVisible: boolean; togglePanels: () => void }) {
  const { t } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const canUndo = useGridStore(s => s.history.length > 0);
  const canRedo = useGridStore(s => s.future.length > 0);
  const { undo, redo, serialize, deserialize } = useGridStore.getState();

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) deserialize(await file.text());
  };

  const handleExport = () => {
    const url = URL.createObjectURL(new Blob([serialize()], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'grid.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="topbar glass">
      <h1><span className="logo" aria-hidden="true"><i /><i /><i /><i /></span>{t.title}</h1>
      <LanguagePicker />
      <div className="top-actions">
        <button className="action panels-toggle" type="button" aria-pressed={panelsVisible}
          aria-label={t.panels} title={t.panels} onClick={togglePanels}><Icon name="panels" /></button>
        <button className="action" disabled={!canUndo} onClick={undo} aria-label={t.undo} title={`${t.undo} (Ctrl / ⌘ Z)`}><Icon name="undo" /><span>{t.undo}</span></button>
        <button className="action" disabled={!canRedo} onClick={redo} aria-label={t.redo} title={`${t.redo} (Ctrl / ⌘ Shift Z)`}><Icon name="redo" /><span>{t.redo}</span></button>
        <span className="action-divider" aria-hidden="true" />
        <button className="action" onClick={() => fileInput.current?.click()} aria-label={t.import} title={`${t.import} JSON`}><Icon name="import" /><span>{t.import}</span></button>
        <button className="action export" onClick={handleExport} aria-label={t.export} title={`${t.export} JSON`}><Icon name="export" /><span>{t.export}</span></button>
        <input hidden type="file" aria-label={t.importFile} accept=".json,application/json" ref={fileInput} onChange={handleImport} />
      </div>
    </header>
  );
}

export function ToolPalette() {
  const { t } = useLanguage();
  const mode = useGridMode();
  const { setMode } = useGridStore.getState();

  useEffect(() => {
    let previousMode: GridMode | null = null;

    const releasePan = () => {
      if (previousMode !== null) setMode(previousMode);
      previousMode = null;
    };
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, select, textarea, [contenteditable="true"]') || event.altKey) return;
      const key = event.key.toLowerCase();
      const { undo, redo, clear, bumpZoom, setZoom } = useGridStore.getState();
      if (event.ctrlKey || event.metaKey) {
        if (key === 'z') (event.shiftKey ? redo : undo)();
        else if (key === 'y') redo();
        else return;
      } else if (key === ' ') {
        if (target?.closest('.panels-toggle, .inspector-toggle')) return;
        if (previousMode === null) previousMode = useGridStore.getState().mode;
        setMode('pan');
      } else if (key === '+' || key === '=') bumpZoom(0.1);
      else if (key === '-' || key === '_') bumpZoom(-0.1);
      else if (key === '0') setZoom(1);
      else if (key === 'delete' || key === 'backspace') clear();
      else {
        const tool = modes.find(item => item.key.toLowerCase() === key);
        if (!tool) return;
        setMode(tool.id);
      }
      event.preventDefault();
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === ' ' && previousMode !== null) {
        releasePan();
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', releasePan);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', releasePan);
    };
  }, [setMode]);

  return (
    <section className="tools glass" aria-label={t.tools}>
      <div className="tool-list" style={{ '--tool-index': modes.findIndex(item => item.id === mode) } as CSSProperties}>
        {modes.map(tool => (
          <button key={tool.id} className="tool" aria-label={t[tool.id]} aria-pressed={tool.id === mode}
            title={`${tool.id === 'fillForward' ? t.directionHint : t[tool.id]} (${tool.key})`} onClick={() => setMode(tool.id)}>
            <Icon name={tool.id} /><span>{t[tool.id]}</span><kbd>{tool.key}</kbd>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ZoomControl({ fitGrid }: { fitGrid: () => void }) {
  const { t } = useLanguage();
  const zoom = useGridZoom();
  const { bumpZoom, setZoom } = useGridStore.getState();
  return (
    <div className="zoom glass" role="group" aria-label={t.zoom}>
      <button aria-label={t.zoomOut} title={`${t.zoomOut} (−)`} disabled={zoom <= ZOOM_LIMITS.min} onClick={() => bumpZoom(-0.1)}><Icon name="minus" /></button>
      <button className="zoom-value" aria-label={t.resetZoom} title={`${t.resetZoom} (0)`} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
      <button aria-label={t.zoomIn} title={`${t.zoomIn} (+)`} disabled={zoom >= ZOOM_LIMITS.max} onClick={() => bumpZoom(0.1)}><Icon name="plus" /></button>
      <span className="zoom-divider" aria-hidden="true" />
      <button className="fit-grid" aria-label={t.fit} title={t.fit} onClick={fitGrid}><Icon name="fit" /></button>
    </div>
  );
}
