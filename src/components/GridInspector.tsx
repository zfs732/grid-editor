import { useEffect, useState } from 'react';
import { useLanguage } from '../language';
import { GRID_SIZE_LIMITS, useGridSize, useGridStore, useSelectedColor } from '../state/gridStore';
import Icon from './Icon';

const colors = ['#0ea5e9', '#a855f7', '#f97316', '#f43f5e', '#22c55e', '#facc15'];

const compactScreen = '(max-width: 780px), (max-height: 520px)';

export default function GridInspector() {
  const { t } = useLanguage();
  const { selectedColor, setSelectedColor } = useSelectedColor();
  const { rows, cols, setGridSize } = useGridSize();
  const [expanded, setExpanded] = useState(() => !window.matchMedia(compactScreen).matches);
  useEffect(() => {
    const media = window.matchMedia(compactScreen);
    const adjust = () => setExpanded(!media.matches);
    media.addEventListener('change', adjust);
    return () => media.removeEventListener('change', adjust);
  }, []);
  const clear = useGridStore(s => s.clear);

  return (
    <aside className="inspector glass" aria-label={t.properties} data-expanded={expanded}>
      <button className="inspector-toggle" aria-label={t.properties} title={t.properties}
        aria-expanded={expanded} aria-controls="grid-properties" onClick={() => setExpanded(value => !value)}>
        <span className="inspector-dot" style={{ backgroundColor: selectedColor }} />
        {expanded && <span>{t.properties}</span>}
        <Icon name="sliders" />
      </button>
      <div id="grid-properties" className="inspector-body" hidden={!expanded}>
        <section>
          <h2>{t.color}</h2>
          <label className="color-field">
            <span className="color-chip" style={{ backgroundColor: selectedColor }} />
            <span className="hex-value">{selectedColor.toUpperCase()}</span>
            <input type="color" aria-label={t.customColor} value={selectedColor}
              onChange={event => setSelectedColor(event.target.value)} />
          </label>
          <div className="swatches" role="group" aria-label={t.presets}>
            {colors.map(color => (
              <button key={color} className="swatch" style={{ backgroundColor: color }}
                title={color.toUpperCase()} aria-label={color.toUpperCase()}
                aria-pressed={selectedColor.toLowerCase() === color} onClick={() => setSelectedColor(color)}>
                {selectedColor.toLowerCase() === color && <Icon name="check" />}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2>{t.grid}</h2>
          {(['rows', 'cols'] as const).map(dimension => {
            const value = dimension === 'rows' ? rows : cols;
            return (
              <label key={dimension} className="size-field">
                <span>{t[dimension]}</span>
                <input key={value} type="number" min={GRID_SIZE_LIMITS.min} max={GRID_SIZE_LIMITS.max}
                  defaultValue={value} onKeyDown={event => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }} onBlur={event => {
                    const input = event.currentTarget;
                    const size = input.valueAsNumber;
                    if (Number.isFinite(size)) {
                      setGridSize(dimension === 'rows' ? size : rows, dimension === 'cols' ? size : cols);
                    }
                    const state = useGridStore.getState();
                    input.value = String(state[dimension]);
                  }} />
              </label>
            );
          })}
        </section>
        <button className="clear action" onClick={clear}><Icon name="trash" />{t.clear}</button>
      </div>
    </aside>
  );
}
