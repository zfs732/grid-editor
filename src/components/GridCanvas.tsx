import { useLanguage } from '../language';
import { PointerEvent, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useGridData, useGridMode, useGridPan, useGridStore, useGridZoom } from '../state/gridStore';

const BASE_CELL_SIZE = 24;

// Keep cells square and let a default 32 × 32 sheet cover the drawing surface at 100%.
export const baseCellSize = (width: number, height: number) => Math.max(width, height) / 32;

function useAnimatedZoom(target: number) {
  const [zoom, setZoom] = useState(target);
  const current = useRef(target);
  useLayoutEffect(() => {
    const start = current.current;
    if (start === target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setZoom(target);
      return;
    }
    const started = performance.now();
    let frame: number;
    const tick = (time: number) => {
      const progress = Math.min(1, Math.max(0, (time - started) / 180));
      current.current = target + (start - target) * (1 - progress) ** 3;
      setZoom(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return zoom;
}

type Gesture =
  | { type: 'draw' | 'paint'; pointer: number }
  | { type: 'pan'; pointer: number; clientX: number; clientY: number; x: number; y: number };

function limitOffset(offset: number, view: number, artwork: number) {
  const limit = (view + artwork) / 2 - Math.min(48, view / 2, artwork / 2);
  return Math.min(limit, Math.max(-limit, offset));
}

export default function GridCanvas() {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const { rows, cols, grid } = useGridData();
  const mode = useGridMode();
  const targetZoom = useGridZoom();
  const zoom = useAnimatedZoom(targetZoom);
  const { panX, panY, setPan } = useGridPan();
  const strokes = useGridStore(state => state.paintStrokes);
  const [view, setView] = useState({ width: 0, height: 0, dpr: 1 });

  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      setView(previous => previous.width === width && previous.height === height && previous.dpr === dpr
        ? previous : { width, height, dpr });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const base = baseCellSize(view.width, view.height);
  const cell = base * zoom;
  const width = cols * cell;
  const height = rows * cell;
  const x = (view.width - width) / 2 + limitOffset(panX, view.width, width);
  const y = (view.height - height) / 2 + limitOffset(panY, view.height, height);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cell) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Keep the bitmap viewport-sized, including at maximum grid size and zoom.
    const pixelWidth = Math.round(view.width * view.dpr);
    const pixelHeight = Math.round(view.height * view.dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    context.setTransform(pixelWidth / view.width, 0, 0, pixelHeight / view.height, 0, 0);
    context.clearRect(0, 0, view.width, view.height);
    context.save();
    context.translate(x, y);
    context.beginPath();
    context.rect(0, 0, width, height);
    context.clip();
    context.fillStyle = '#091a2c';
    context.fillRect(0, 0, width, height);

    const firstRow = Math.max(0, Math.floor(-y / cell));
    const lastRow = Math.min(rows, Math.ceil((view.height - y) / cell));
    const firstCol = Math.max(0, Math.floor(-x / cell));
    const lastCol = Math.min(cols, Math.ceil((view.width - x) / cell));
    for (let row = firstRow; row < lastRow; row++) {
      for (let col = firstCol; col < lastCol; col++) {
        const color = grid[row][col];
        if (color) {
          context.fillStyle = color;
          context.fillRect(col * cell, row * cell, cell, cell);
        }
      }
    }

    for (const major of [false, true]) {
      context.beginPath();
      for (let i = firstCol; i <= lastCol; i++) {
        if ((i % 8 === 0) !== major) continue;
        context.moveTo(i * cell, 0);
        context.lineTo(i * cell, height);
      }
      for (let i = firstRow; i <= lastRow; i++) {
        if ((i % 8 === 0) !== major) continue;
        context.moveTo(0, i * cell);
        context.lineTo(width, i * cell);
      }
      context.strokeStyle = major ? '#415973' : '#2c4057';
      context.lineWidth = 1;
      context.stroke();
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const stroke of strokes) {
      const [first] = stroke.points;
      if (!first) continue;
      const thickness = stroke.width * cell / BASE_CELL_SIZE;
      context.beginPath();
      if (stroke.points.length === 1) {
        context.fillStyle = stroke.color;
        context.arc(first.x * cell, first.y * cell, thickness / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.strokeStyle = stroke.color;
        context.lineWidth = thickness;
        context.moveTo(first.x * cell, first.y * cell);
        for (let i = 1; i < stroke.points.length; i++) {
          const point = stroke.points[i];
          context.lineTo(point.x * cell, point.y * cell);
        }
        context.stroke();
      }
    }
    context.restore();
  }, [cell, cols, grid, height, rows, strokes, view, width, x, y]);

  const geometry = useRef({ x, y, cell });
  useLayoutEffect(() => { geometry.current = { x, y, cell }; }, [x, y, cell]);

  const pointFrom = (event: PointerEvent<HTMLCanvasElement>) => {
    const { x, y, cell } = geometry.current;
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left - x) / cell, y: (event.clientY - rect.top - y) / cell };
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || gesture.current || !cell) return;
    const canvas = event.currentTarget;
    if (document.activeElement !== canvas) flushSync(() => canvas.focus({ preventScroll: true }));
    const { pointerId: pointer } = event;
    const state = useGridStore.getState();
    if (mode === 'pan') {
      gesture.current = { type: 'pan', pointer, clientX: event.clientX, clientY: event.clientY,
        x: limitOffset(state.panX, view.width, state.cols * cell),
        y: limitOffset(state.panY, view.height, state.rows * cell) };
    } else {
      const point = pointFrom(event);
      if (point.x < 0 || point.y < 0 || point.x >= state.cols || point.y >= state.rows) return;
      if (mode === 'paint') {
        gesture.current = { type: 'paint', pointer };
        state.startPaintStroke(point);
      } else {
        gesture.current = { type: 'draw', pointer };
        state.applyCellAction(Math.floor(point.y), Math.floor(point.x));
      }
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(pointer);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    if (active.type === 'pan') {
      setPan(limitOffset(active.x + event.clientX - active.clientX, view.width, width),
        limitOffset(active.y + event.clientY - active.clientY, view.height, height));
    } else {
      const point = pointFrom(event);
      const state = useGridStore.getState();
      if (active.type === 'paint') state.updatePaintStroke(point);
      else state.applyCellAction(Math.floor(point.y), Math.floor(point.x));
    }
  };
  const pointerEnd = (event: PointerEvent<HTMLCanvasElement>) => {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    gesture.current = null;
    const state = useGridStore.getState();
    if (active.type === 'paint') state.endPaintStroke();
    if (active.type === 'pan') setPan(state.panX, state.panY, true);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <canvas ref={canvasRef} tabIndex={-1} className="grid-canvas" data-mode={mode} aria-label={t.canvas(rows, cols)}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} />
  );
}
