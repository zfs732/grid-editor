const paths = {
  panels: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm4 0v16m8-16v16',
  fit: 'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5',
  sliders: 'M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m6 4v6',
  monitor: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm8 13v3m-4 0h8',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0ZM3 12h18M12 3c-4.7 4.6-4.7 13.4 0 18 4.7-4.6 4.7-13.4 0-18Z',
  draw: 'm15 4 5 5M4 20l1.2-5.2L16.5 3.5a2.2 2.2 0 0 1 3.1 0l.9.9a2.2 2.2 0 0 1 0 3.1L9.2 18.8 4 20Z',
  paint: 'm12 13 7.2-9.3a1.6 1.6 0 0 1 2.4 2.1L14 15M12 13c-2.5-1.2-5 .4-5 3.2 0 1.7-1.2 2.9-3.4 3.4 4.4 1.9 9.6 1.1 10.4-2.5.4-1.8-.4-3.4-2-4.1Z',
  erase: 'm14.6 3.8 5.6 5.6a1.6 1.6 0 0 1 0 2.3L12 20H7l-4-4a1.6 1.6 0 0 1 0-2.3l9.3-9.9a1.6 1.6 0 0 1 2.3 0ZM7.2 9.7l7.1 7.1M11 20h10',
  fill: 'm6 3 9 9M4 11l6-6 8 8-7.3 7.3a1.4 1.4 0 0 1-2 0L3 14.6a1.6 1.6 0 0 1 0-2.2L4 11Zm-.6 2.5h14M19.8 15.5s-1.8 2.3-1.8 3.5a1.8 1.8 0 1 0 3.6 0c0-1.2-1.8-3.5-1.8-3.5Z',
  fillForward: 'M10 4H5a1 1 0 0 0-1 1v5m0 4v5a1 1 0 0 0 1 1h5m4-16h5a1 1 0 0 1 1 1v5M10 10l9 9m-6 0h6v-6',
  pan: 'M8 13V6a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v7c0 4.4-2.5 7-6.8 7-2.7 0-4.5-1.2-6-3.2l-3.6-4.7a1.5 1.5 0 0 1 2.2-2L8 13Z',
  undo: 'M9 5 4 10l5 5M5 10h9a5 5 0 0 1 0 10h-3',
  redo: 'm15 5 5 5-5 5m4-5h-9a5 5 0 0 0 0 10h3',
  import: 'M12 3v11m-4-4 4 4 4-4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  export: 'M12 15V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  trash: 'M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14m-8 4v6m4-6v6',
  minus: 'M5 12h14',
  plus: 'M5 12h14m-7-7v14',
  check: 'm5 12 4 4L19 6'
};

export default function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
