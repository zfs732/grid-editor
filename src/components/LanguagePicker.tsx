import { KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLanguage } from '../language';
import Icon from './Icon';

const choices = ['zh', 'en', 'auto'] as const;

export default function LanguagePicker() {
  const { language, preference, select, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const initialFocus = useRef(0);
  const menuId = useId();
  const currentLabel = language === 'zh' ? '中文' : 'EN';
  const labels = { zh: '简体中文', en: 'English', auto: t.followBrowser };

  function show(index: number) {
    initialFocus.current = index;
    setOpen(true);
  }

  function closeAndFocusTrigger() {
    trigger.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  useLayoutEffect(() => {
    if (open) items.current[initialFocus.current]?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [open]);

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % choices.length; break;
      case 'ArrowUp': next = (index + choices.length - 1) % choices.length; break;
      case 'Home': next = 0; break;
      case 'End': next = choices.length - 1; break;
      case 'Escape':
        event.preventDefault();
        closeAndFocusTrigger();
        return;
      case 'Tab':
        closeAndFocusTrigger();
        return;
      default: return;
    }
    event.preventDefault();
    items.current[next]?.focus({ preventScroll: true });
  }

  return (
    <div className="language-picker" ref={root} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" className="action language-trigger"
        aria-label={`${t.language} · ${labels[language]}`} aria-haspopup="menu" aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => open ? setOpen(false) : show(choices.indexOf(preference))}
        onKeyDown={event => {
          if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show(event.key === 'ArrowDown' ? 0 : choices.length - 1);
          }
        }}>
        <Icon name="globe" /><span>{currentLabel}</span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={t.language} className="language-menu" onKeyDown={navigate}>
          {choices.map((value, index) => (
            <button key={value} ref={element => { items.current[index] = element; }}
              type="button" role="menuitemradio" aria-checked={preference === value} tabIndex={-1}
              className={value === 'auto' ? 'language-option automatic' : 'language-option'}
              lang={value === 'auto' ? undefined : value === 'zh' ? 'zh-CN' : 'en'}
              onClick={() => { select(value); closeAndFocusTrigger(); }}>
              {value === 'auto' && <Icon name="monitor" />}
              <span>{labels[value]}</span>
              {preference === value && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
