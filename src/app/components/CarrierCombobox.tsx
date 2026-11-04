import { useEffect, useId, useMemo, useRef, useState } from 'react';

// Interlata (PIC) / Intralata (LPIC) carrier field — RFBP1-3679 (Change) and RFBP1-3681 (Net-New).
// Searchable combobox over an approved list (no free text). Spec: "3 · Field states and rules".
//  · Opens on focus/click. Rightfiber options first, then third-party carriers A–Z.
//  · Typing keeps options whose name or code contains the text; the match is bold.
//  · Leaving the field with text typed and nothing picked restores the previous value.
//  · ↑ ↓ move, Enter selects, Esc closes, × clears (and reopens the list).
//  · Combobox + listbox; result count and "no match" are announced as status.

export interface Carrier { code: string; name: string; rf: boolean }

// Sample carrier data.
export const CARRIERS: Carrier[] = [
  { code: '6319', name: 'Rightfiber (ILEC)', rf: true },
  { code: '9163', name: 'Rightfiber (CLEC)', rf: true },
  { code: '0111', name: 'AT & T', rf: false },
  { code: '0222', name: 'CenturyLink', rf: false },
  { code: '0333', name: 'Comcast Communications Corporation of Indiana', rf: false },
  { code: '0404', name: 'Frontier', rf: false },
  { code: '0515', name: 'Maplenet Wireless', rf: false },
  { code: '0626', name: 'Mediacom', rf: false },
  { code: '0737', name: 'Metronet', rf: false },
  { code: '0848', name: 'Spectrum', rf: false },
  { code: '0959', name: 'Verizon', rf: false },
  { code: '1060', name: 'Windstream', rf: false },
].sort((a, b) => (a.rf === b.rf ? a.name.localeCompare(b.name) : a.rf ? -1 : 1));

/** "0404 · Frontier" for a known code; any other stored value (e.g. a legacy "Other") is returned as is. */
export function carrierLabel(value: string): string {
  const c = CARRIERS.find(c => c.code === value);
  return c ? `${c.code} · ${c.name}` : value;
}

function Highlight({ text, q, strong }: { text: string; q: string; strong?: boolean }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{ fontWeight: 700, color: '#1E3A8A' }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

interface Props {
  label: string;               // e.g. "Interlata Carrier"
  value: string;               // carrier code, '' (blank) or a legacy value not on the list
  onChange: (code: string) => void;
}

export function CarrierCombobox({ label, value, onChange }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const q = query.trim().toLowerCase();
  const options = useMemo(
    () => CARRIERS.filter(c => !q || c.name.toLowerCase().includes(q) || c.code.includes(q)),
    [q],
  );

  const onList = CARRIERS.some(c => c.code === value);
  const blank = value === '';
  const notOnList = !blank && !onList;
  const shown = open ? query : carrierLabel(value);

  useEffect(() => { setActive(0); }, [q]);

  // Keep the active option in view while moving with the keyboard.
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, uid]);

  const close = () => { setOpen(false); setQuery(''); };       // text typed but nothing picked → previous value stays
  const openList = () => { if (!open) { setOpen(true); setQuery(''); setActive(0); } };
  const pick = (c: Carrier) => { onChange(c.code); close(); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) openList(); else if (options.length) setActive(i => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!open) openList(); else if (options.length) setActive(i => (i <= 0 ? options.length - 1 : i - 1)); }
    else if (e.key === 'Enter') { if (open && options[active]) { e.preventDefault(); pick(options[active]); } }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); close(); } }
  };

  const status = !open ? '' : options.length === 0
    ? `No carriers match ${query.trim()}. Check the name or code and try again.`
    : q ? `${options.length} carriers match` : `${CARRIERS.length} carriers available`;

  const border = open ? '#2563EB' : blank ? '#DC2626' : notOnList ? '#B45309' : '#CBD5E1';
  const hint = open ? null
    : blank ? { text: `${label} is required. Select a carrier to continue.`, color: '#B91C1C' }
    : notOnList ? { text: 'Not on the approved list. Choose a carrier to replace it.', color: '#92400E' }
    : null;

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onBlur={e => { if (!wrapRef.current?.contains(e.relatedTarget as Node)) close(); }}
    >
      <div
        className="flex items-center gap-1.5 h-11 pl-3 pr-2 bg-white cursor-text"
        style={{ border: `1.5px solid ${border}`, borderRadius: 10, boxShadow: open ? '0 0 0 3px rgba(37, 99, 235, 0.18)' : 'none' }}
        onClick={() => { inputRef.current?.focus(); openList(); }}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${uid}-opt-${active}` : undefined}
          aria-invalid={blank || undefined}
          autoComplete="off"
          title={carrierLabel(value) || undefined}
          value={shown}
          placeholder="Search by name or code"
          onFocus={openList}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm truncate placeholder:text-slate-500"
          style={{ color: '#0F172A' }}
        />
        {onList && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onMouseDown={e => e.preventDefault()}
            onClick={e => { e.stopPropagation(); onChange(''); setOpen(true); setQuery(''); inputRef.current?.focus(); }}
            className="flex-none p-1 rounded hover:bg-slate-100"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        )}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none"><path d="M3.5 6l4.5 4.5L12.5 6" /></svg>
      </div>

      {hint && <p className="mt-1.5 mx-0.5 text-[13px] leading-snug font-medium" style={{ color: hint.color }}>{hint.text}</p>}

      <div role="status" aria-live="polite" className="sr-only">{status}</div>

      {open && (
        <div
          className="absolute right-0 z-30 mt-1.5 w-full min-w-[21rem] bg-white overflow-hidden"
          style={{ border: '1px solid #CBD5E1', borderRadius: 12, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)' }}
        >
          <ul id={listId} role="listbox" aria-label={`${label} options`} className="m-0 p-1.5 list-none max-h-52 overflow-y-auto">
            {options.map((c, i) => (
              <li
                key={c.code}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={c.code === value}
                title={`${c.code} · ${c.name}`}
                onMouseDown={e => { e.preventDefault(); pick(c); }}
                onMouseEnter={() => setActive(i)}
                className="flex items-center gap-2.5 px-2 py-[9px] rounded-lg cursor-pointer"
                style={{ background: i === active ? '#EFF6FF' : 'transparent' }}
              >
                <span className="flex-none w-10 text-[13px] tabular-nums" style={{ color: '#475569' }}><Highlight text={c.code} q={q} /></span>
                <span className="flex-1 min-w-0 text-sm truncate"><Highlight text={c.name} q={q} /></span>
                {c.rf && (
                  <span className="flex-none text-[10px] font-semibold tracking-wide rounded-full px-[7px] py-0.5" style={{ color: '#1E40AF', background: '#E0EAFF' }}>RIGHTFIBER</span>
                )}
              </li>
            ))}
          </ul>
          {options.length === 0 && (
            <div className="px-3.5 pt-3.5 pb-4 text-[13px] leading-snug" style={{ color: '#475569' }}>
              No carriers match “{query.trim()}”. Check the name or code and try again.
            </div>
          )}
          <div className="px-3.5 py-[7px] text-xs" style={{ borderTop: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
            {options.length === 0 ? '0 carriers match'
              : q ? `${options.length} carriers match`
              : `${CARRIERS.length} carriers available${options.length > 5 ? ' · scroll for more' : ''}`}
          </div>
        </div>
      )}
    </div>
  );
}
