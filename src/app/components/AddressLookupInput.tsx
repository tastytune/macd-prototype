import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';

// Google Places-style address autocomplete (mocked — the prototype has no real Places API call).
// Typing 3+ characters shows a debounced dropdown of matching addresses with the typed part in bold;
// picking one fills the input with the full formatted address. Keyboard: ↑ ↓ Enter Esc.

interface AddressSuggestion { street: string; city: string; state: string; zip: string }

const ADDRESS_DB: AddressSuggestion[] = [
  { street: '412 Oak Ave',       city: 'Lincoln',     state: 'NE', zip: '68501' },
  { street: '414 Oak Ave',       city: 'Lincoln',     state: 'NE', zip: '68501' },
  { street: '412 Oakmont Dr',    city: 'Lincoln',     state: 'NE', zip: '68510' },
  { street: '305 Cedar Ln',      city: 'Lincoln',     state: 'NE', zip: '68505' },
  { street: '850 N 96th St',     city: 'Omaha',       state: 'NE', zip: '68114' },
  { street: '852 N 96th St',     city: 'Omaha',       state: 'NE', zip: '68114' },
  { street: '450 Birchwood Ave', city: 'Springfield', state: 'IL', zip: '62704' },
  { street: '452 Birchwood Ave', city: 'Springfield', state: 'IL', zip: '62704' },
  { street: '123 Main St',       city: 'Springfield', state: 'IL', zip: '62701' },
  { street: '125 Main St',       city: 'Springfield', state: 'IL', zip: '62701' },
  { street: '123 Main St',       city: 'Springfield', state: 'MO', zip: '65806' },
  { street: '789 Oak Ridge Dr',  city: 'Austin',      state: 'TX', zip: '78701' },
  { street: '42 Maple Ave',      city: 'Portland',    state: 'OR', zip: '97201' },
];

const format = (a: AddressSuggestion) => `${a.street}, ${a.city}, ${a.state} ${a.zip}`;

function lookup(query: string): Promise<AddressSuggestion[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const q = query.toLowerCase();
      resolve(ADDRESS_DB.filter(a => format(a).toLowerCase().includes(q)).slice(0, 5));
    }, 300 + Math.random() * 200);
  });
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold">{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  inputClassName?: string;
  id?: string;
}

export function AddressLookupInput({ value, onChange, onEnter, placeholder, inputClassName, id = 'address-lookup' }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    const q = v.trim();
    if (q.length < 3) { setOpen(false); setLoading(false); setOptions([]); return; }
    setOpen(true);
    setLoading(true);
    const my = ++reqId.current;
    timer.current = setTimeout(() => {
      lookup(q).then(res => { if (my === reqId.current) { setOptions(res); setLoading(false); } });
    }, 150);
  };

  const pick = (a: AddressSuggestion) => {
    reqId.current++;
    onChange(format(a));
    setOpen(false);
    setOptions([]);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open && options.length) { e.preventDefault(); setActive(i => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp' && open && options.length) { e.preventDefault(); setActive(i => (i <= 0 ? options.length - 1 : i - 1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') {
      if (open && active >= 0 && options[active]) { e.preventDefault(); pick(options[active]); }
      else { setOpen(false); onEnter?.(); }
    }
  };

  const q = value.trim();

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (options.length || loading) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputClassName}
        />
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> Searching addresses…
            </div>
          ) : options.length ? (
            <ul id={`${id}-list`} role="listbox">
              {options.map((a, i) => (
                <li key={`${format(a)}-${i}`} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={e => { e.preventDefault(); pick(a); }}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left text-sm border-b border-gray-100 last:border-b-0 transition-colors ${i === active ? 'bg-gray-50' : ''}`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="text-gray-900"><Highlight text={a.street} query={q} /></span>
                      <span className="text-gray-500">, {a.city}, {a.state} {a.zip}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No matching addresses found</div>
          )}
        </div>
      )}
    </div>
  );
}
