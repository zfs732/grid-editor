import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language';
import GridCanvas, { baseCellSize } from './components/GridCanvas';
import GridInspector from './components/GridInspector';
import { ToolPalette, TopBar, ZoomControl } from './components/Toolbar';
import { useGridStore } from './state/gridStore';

const App = () => {
  const { t } = useLanguage();
  const workbench = useRef<HTMLElement>(null);
  const [panelsVisible, setPanelsVisible] = useState(true);
  const loadFromStorage = useGridStore(state => state.loadFromStorage);
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  function fitGrid() {
    const stage = workbench.current!;
    const canvas = stage.querySelector('canvas')!.getBoundingClientRect();
    const left = stage.querySelector('.tools')!.getBoundingClientRect();
    const right = stage.querySelector('.inspector')!.getBoundingClientRect();
    const bottom = stage.querySelector('.zoom')!.getBoundingClientRect().top;
    const { rows, cols, setZoom } = useGridStore.getState();

    // A rectangular document may fit better below one of the floating panels than between them.
    const spaces = [
      { left: left.right, right: right.left, top: canvas.top },
      { left: canvas.left, right: right.left, top: left.bottom },
      { left: left.right, right: canvas.right, top: right.bottom },
      { left: canvas.left, right: canvas.right, top: Math.max(left.bottom, right.bottom) }
    ];
    const padding = 8;
    const capacity = (space: typeof spaces[number]) => Math.min(
      (space.right - space.left - 2 * padding) / cols,
      (bottom - space.top - 2 * padding) / rows
    );
    const best = spaces.reduce((a, b) => capacity(b) > capacity(a) ? b : a);

    if (capacity(best) <= 0) {
      setZoom(Math.min(canvas.width / cols, canvas.height / rows) / baseCellSize(canvas.width, canvas.height), { panX: 0, panY: 0 });
      return;
    }
    setZoom(capacity(best) / baseCellSize(canvas.width, canvas.height), {
      panX: (best.left + best.right - canvas.left - canvas.right) / 2,
      panY: (best.top + bottom - canvas.top - canvas.bottom) / 2
    });
  }

  return (
    <div className="app-shell">
      <TopBar panelsVisible={panelsVisible} togglePanels={() => setPanelsVisible(visible => !visible)} />
      <main ref={workbench} className="workbench" aria-label={t.workspace} data-panels={panelsVisible ? 'open' : 'hidden'}>
        <GridCanvas />
        <ToolPalette />
        <GridInspector />
        <ZoomControl fitGrid={fitGrid} />
      </main>
    </div>
  );
};

export default App;
