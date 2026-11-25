import { useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  Eye, EyeOff, KeySquare,
  ShieldCheck, Info, Search, UserPlus, TriangleAlert, Phone, ArrowRight, CalendarDays,
  Upload, FileText, Lock, X, CheckCircle2, ExternalLink, Wrench, Users, Receipt,
} from 'lucide-react';
import type { Service } from '../App';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';
import { AppointmentPanel, formatDateLabel, slotLabel } from './AppointmentPanel';

/**
 * Change of Ownership (CHOWN) — MACD003 rules + UIUX012 guided flow.
 * Source: "Spark – Change of Ownership (CHOWN)" functionality definition (Rita Maretti, 23 Nov 2026)
 * and "CHOWN MACD003 and UIUX012 – Feature Definitions v2" (18 Nov 2026).
 *
 * Owls Head proposal, to validate with the Rightfiber CRC team. Elements that depend on an open
 * question carry a <ToConfirm id="…" /> pill, numbered as in the Feature Definitions v2 (see OPEN_ITEMS).
 *
 * Front-end prototype only: all data below is mock.
 */

// ── Mock data ────────────────────────────────────────────────────────────────

const PREVIOUS_OWNER = { name: 'Robert Johnson', account: 'ACC-004821' };

/** People on the current account who may request a CHOWN (R2), each with their CPNI password/PIN on file. */
const ACCOUNT_CONTACTS = [
  { id: 'c-robert', name: 'Robert Johnson', role: 'Primary account holder', cpni: '4821' },
  { id: 'c-linda', name: 'Linda Johnson', role: 'Authorized user', cpni: 'Maple77' },
];

interface SAProfile {
  services: string[];
  phoneNumber?: string;
  portedIn?: boolean;
  outstandingBalance: number;
  billingAccount: string;
}

const SA_PROFILE: Record<string, SAProfile> = {
  'sa-00912': { services: ['Internet 200Mbps', 'iTV Preferred', 'Cinemax', 'FANatic'], outstandingBalance: 142.17, billingAccount: 'BA-00391' },
  'sa-01047': { services: ['Internet 200M', 'Phone Bundle'], phoneNumber: '(402) 555-0147', outstandingBalance: 0, billingAccount: 'BA-00558' },
  'sa-02031': { services: ['Phone Standalone'], phoneNumber: '(402) 555-0231', portedIn: true, outstandingBalance: 0, billingAccount: 'BA-00602' },
};

interface Customer {
  id: string;
  name: string;
  account: string;
  email: string;
  phone: string;
  isNew?: boolean;
}

const EXISTING_CUSTOMERS: Customer[] = [
  { id: 'cust-linda', name: 'Linda Johnson', account: 'ACC-005112', email: 'linda.johnson@email.com', phone: '(402) 555-0190' },
  { id: 'cust-maria', name: 'Maria Lopez', account: 'ACC-007340', email: 'maria.lopez@email.com', phone: '(402) 555-0388' },
  { id: 'cust-daniel', name: 'Daniel Okafor', account: 'ACC-006218', email: 'd.okafor@email.com', phone: '(531) 555-0122' },
];

/** Same-customer scope (Q1): Robert's other billing accounts. */
const SAME_CUSTOMER_BAS = [
  { id: 'BA-00558', detail: 'Primary billing · Monthly · linked to SA-01047' },
  { id: 'BA-00777', detail: 'New billing account (create)' },
];

const REASONS = ['Bereavement', 'Roommate or partner leaving', 'Property sold or rented', 'Other'];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STEPS = ['Service account', 'Requester', 'New owner', 'Path & date', 'Documents', 'Review'];

type Step = 'requester' | 'new-owner' | 'path-date' | 'documents' | 'review' | 'confirmation';
type Scope = 'differentCustomer' | 'sameCustomer';
type Path = 'transfer' | 'disconnectConnect';
type EffectiveDate = 'today' | 'nextCycle';

interface UploadedDoc { id: string; name: string; size: number; internal: boolean }

const digits = (s: string) => s.replace(/\D/g, '');
const money = (n: number) => `$${n.toFixed(2)}`;
const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function nextBillCycle(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

/**
 * Open items, numbered as in "CHOWN MACD003 and UIUX012 – Feature Definitions v2" (18 Nov 2026).
 * BR9 is a business rule still marked "To confirm" there (no question number of its own).
 */
const OPEN_ITEMS = {
  'MACD003-Q4': { owner: 'Product Owner / Jill', text: 'Is billing account to billing account (same customer) in scope, as well as account to account? Can the balance move in that case?' },
  'MACD003-Q6': { owner: 'Melissa', text: 'What happens to ported-in numbers?' },
  'MACD003-Q7': { owner: 'Jill / billing', text: 'When services move to a different customer, does the outstanding balance stay with the previous owner?' },
  'MACD003-Q8': { owner: 'Melissa / compliance', text: 'What may the new owner see: billing history, payments made, call history (CPNI)?' },
  'MACD003-Q9': { owner: 'Product Owner / compliance', text: 'Should the previous owner (or their estate) sign or confirm the transfer? Today no one signs.' },
  'MACD003-BR9': { owner: 'Rightfiber', text: 'Effective date is today or the next bill cycle (rule still to confirm).' },
  'UIUX012-Q1': { owner: 'Rightfiber CRC', text: 'Which details are required to create a new owner?' },
  'UIUX012-Q2': { owner: 'Rightfiber CRC', text: 'Does the flow need a "waiting for new owner" state when the previous owner calls first?' },
  'UIUX012-Q3': { owner: 'Rightfiber (Tyler)', text: 'Should the agent record a reason (death, roommate, other)?' },
  'UIUX012-Q4': { owner: 'Joni / architecture', text: 'Should documents be uploaded in the flow or on the account afterwards?' },
} as const;

function ToConfirm({ id }: { id: keyof typeof OPEN_ITEMS }) {
  const item = OPEN_ITEMS[id];
  const label = id.replace('-', ' ');
  return (
    <span className="relative group inline-flex">
      <span
        tabIndex={0}
        aria-label={`To confirm, ${label}: ${item.text}`}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        To confirm · {label}
      </span>
      <span role="tooltip" className="absolute bottom-full left-0 mb-2 w-72 px-3 py-2 bg-gray-800 text-white text-xs font-normal normal-case tracking-normal rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-20">
        <span className="font-semibold">{label}</span> · {item.owner}<br />{item.text}
      </span>
    </span>
  );
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>
      {aside}
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2 ${checked ? 'border-blue-600' : 'border-gray-300 bg-white'}`} style={{ width: 18, height: 18 }} aria-hidden="true">
      {checked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
    </div>
  );
}

function OptionCard({ checked, onClick, children, disabled }: { checked: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full
        ${disabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : checked ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <Radio checked={checked} />
      <div className="flex-1 min-w-0">{children}</div>
    </button>
  );
}

function Footer({ onBack, onNext, nextLabel = 'Next', canNext = true, backLabel = 'Back' }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; canNext?: boolean; backLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-10">
      {onBack && (
        <button onClick={onBack} className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
          {backLabel}
        </button>
      )}
      <button
        onClick={() => canNext && onNext()}
        disabled={!canNext}
        className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors ${canNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ── Flow ─────────────────────────────────────────────────────────────────────

interface ChangeOwnershipFlowProps {
  selectedSA: Service | null;
  /** Back from the first CHOWN screen → service account picker. */
  onBack: () => void;
  /** Return to the account after the confirmation screen. */
  onFinish: () => void;
}

export function ChangeOwnershipFlow({ selectedSA, onBack, onFinish }: ChangeOwnershipFlowProps) {
  const saId = selectedSA?.id ?? 'sa-00912';
  const profile = SA_PROFILE[saId] ?? SA_PROFILE['sa-00912'];
  const hasPhone = !!profile.phoneNumber;

  const [step, setStep] = useState<Step>('requester');

  // Requester (R2 / UR2)
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [showCpni, setShowCpni] = useState(false);
  const [cpniVerified, setCpniVerified] = useState(false);
  const [reason, setReason] = useState<string>('');

  // New owner (UR3, AC-3, AC-4)
  const [scope, setScope] = useState<Scope>('differentCustomer');
  const [query, setQuery] = useState('');
  const [newOwner, setNewOwner] = useState<Customer | null>(null);
  const [sameCustomerBA, setSameCustomerBA] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [duplicate, setDuplicate] = useState<Customer | null>(null);

  // Path & date (R4, R9, UR4–UR6, UR9)
  const [keepNumber, setKeepNumber] = useState<boolean | null>(null);
  const [effective, setEffective] = useState<EffectiveDate>('today');
  const [showAppointment, setShowAppointment] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptSlot, setApptSlot] = useState<string | null>(null);

  // Documents (R11, Q6, Q14)
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [prevOwnerConfirmed, setPrevOwnerConfirmed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Confirmation
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);

  const path: Path = hasPhone && keepNumber ? 'transfer' : 'disconnectConnect';
  const effectiveDate = effective === 'today' ? new Date() : nextBillCycle();
  const dayBefore = new Date(effectiveDate); dayBefore.setDate(dayBefore.getDate() - 1);
  const isSameCustomer = scope === 'sameCustomer';
  const requester = ACCOUNT_CONTACTS.find(c => c.id === requesterId) ?? null;
  const requesterNotListed = requesterId === 'not-listed';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const qd = digits(q);
    return EXISTING_CUSTOMERS.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (qd.length >= 3 && digits(c.phone).includes(qd)));
  }, [query]);

  const newOwnerLabel = isSameCustomer ? `${PREVIOUS_OWNER.name} · ${sameCustomerBA ?? ''}` : newOwner?.name ?? '';
  const crumbIndex: Record<Step, number> = { requester: 1, 'new-owner': 2, 'path-date': 3, documents: 4, review: 5, confirmation: 5 };

  const header = (title: string, subtitle?: React.ReactNode) => (
    <div>
      <h1 className="text-3xl text-gray-900 mb-2">{title}</h1>
      <ContextBar action="changeOwnership" selectedSA={selectedSA} />
      {step !== 'confirmation' && <Breadcrumb steps={STEPS} currentIndex={crumbIndex[step]} variant="plain" />}
      {subtitle && <p className="text-sm text-gray-600 -mt-2 mb-6">{subtitle}</p>}
    </div>
  );

  // ── Create-customer handlers ──
  const formValid = form.firstName.trim() && form.lastName.trim() && /\S+@\S+\.\S+/.test(form.email) && digits(form.phone).length >= 10;

  const commitNewCustomer = () => {
    setNewOwner({
      id: 'cust-new',
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      account: 'New account',
      email: form.email.trim(),
      phone: form.phone.trim(),
      isNew: true,
    });
    setCreating(false);
    setDuplicate(null);
  };

  const handleCreate = () => {
    const match = EXISTING_CUSTOMERS.find(c =>
      c.email.toLowerCase() === form.email.trim().toLowerCase() || digits(c.phone) === digits(form.phone));
    if (match && !duplicate) { setDuplicate(match); return; }
    commitNewCustomer();
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    // Snapshot now: the FileList is live and is emptied when the input value is reset.
    const added = Array.from(files).map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, internal: false }));
    setDocs(prev => [...prev, ...added]);
  };

  const submit = () => {
    const n = () => `ORD-${Math.floor(30000 + Math.random() * 9999)}`;
    setOrderNumbers(path === 'transfer' ? [n()] : [n(), n()]);
    setStep('confirmation');
  };

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 1 — Requester check
  // ═════════════════════════════════════════════════════════════════════════
  if (step === 'requester') {
    const canNext = !!requester && cpniVerified;
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        {header('Verify the requester', <>Confirm who is calling before starting the change of ownership on <span className="font-semibold">{selectedSA?.name}</span>.</>)}

        <SectionTitle aside={
          <button type="button" onClick={() => setShowCpni(v => !v)} aria-pressed={showCpni}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline normal-case tracking-normal">
            {showCpni ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showCpni ? 'Hide CPNI' : 'Show CPNI'}
          </button>
        }>Who is calling?</SectionTitle>
        <div className="flex flex-col gap-3 mb-4" role="radiogroup" aria-label="Requester">
          {ACCOUNT_CONTACTS.map(c => (
            <OptionCard key={c.id} checked={requesterId === c.id} onClick={() => setRequesterId(c.id)}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.role} · {PREVIOUS_OWNER.account}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-end gap-1">
                    <KeySquare className="w-3 h-3" /> CPNI password / PIN
                  </p>
                  <p className={`text-sm font-mono mt-0.5 ${showCpni ? 'text-gray-900 font-semibold' : 'text-gray-400 tracking-widest'}`}
                    aria-label={showCpni ? `CPNI ${c.cpni}` : 'CPNI hidden'}>
                    {showCpni ? c.cpni : '•'.repeat(c.cpni.length)}
                  </p>
                </div>
              </div>
            </OptionCard>
          ))}
          <OptionCard checked={requesterNotListed} onClick={() => { setRequesterId('not-listed'); setCpniVerified(false); }}>
            <p className="text-sm font-semibold text-gray-900">Someone not on the account</p>
            <p className="text-xs text-gray-500 mt-0.5">For example, the new owner calling first.</p>
          </OptionCard>
        </div>

        {requesterNotListed && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">The change of ownership can't be started by this caller.</p>
              <p className="text-xs mt-0.5">Only someone on the account who gives the CPNI password or PIN can request it. The previous owner stays billed until the change takes effect.</p>
              <p className="text-xs mt-2 flex items-center gap-2">Should the request wait until the new owner calls? <ToConfirm id="UIUX012-Q2" /></p>
            </div>
          </div>
        )}

        {requester && (
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-8 ${cpniVerified ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <input type="checkbox" checked={cpniVerified} onChange={e => setCpniVerified(e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${cpniVerified ? 'text-green-600' : 'text-gray-400'}`} />
                {requester.name} gave the CPNI password or PIN on file
                <span className="relative group">
                  <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs font-normal rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    CPNI = Customer Proprietary Network Information. FCC rules protect it, so the caller must authenticate with the account password or PIN before any account change.
                  </span>
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Ask the caller for it and compare it with the value on their card above. Required to continue. No fee and no supervisor approval are needed.</p>
            </div>
          </label>
        )}

        <SectionTitle aside={<ToConfirm id="UIUX012-Q3" />}>Reason for the change (optional)</SectionTitle>
        {/* Same native select styling as the Temporary Disconnect reason. */}
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          aria-label="Reason for the change (optional)"
          className={`w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${reason ? 'text-gray-900' : 'text-gray-500'}`}
        >
          <option value="">Select a reason</option>
          {REASONS.map(r => (
            <option key={r} value={r} className="text-gray-900">{r}</option>
          ))}
        </select>

        <Footer onBack={onBack} onNext={() => setStep('new-owner')} canNext={canNext} />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 2 — New owner
  // ═════════════════════════════════════════════════════════════════════════
  if (step === 'new-owner') {
    const canNext = isSameCustomer ? !!sameCustomerBA : !!newOwner;
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        {header('New owner', 'Find the customer taking over the services at this address, or create them.')}

        <SectionTitle aside={<ToConfirm id="MACD003-Q4" />}>Where do the services go?</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-8" role="radiogroup" aria-label="Scope">
          <OptionCard checked={scope === 'differentCustomer'} onClick={() => setScope('differentCustomer')}>
            <p className="text-sm font-semibold text-gray-900">To a different customer</p>
            <p className="text-xs text-gray-500 mt-0.5">Account to account. The previous owner's history stays with them.</p>
          </OptionCard>
          <OptionCard checked={scope === 'sameCustomer'} onClick={() => setScope('sameCustomer')}>
            <p className="text-sm font-semibold text-gray-900">To another billing account of {PREVIOUS_OWNER.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Billing account to billing account, same customer.</p>
          </OptionCard>
        </div>

        {isSameCustomer ? (
          <>
            <SectionTitle>Billing account</SectionTitle>
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Billing account">
              {SAME_CUSTOMER_BAS.map(ba => (
                <OptionCard key={ba.id} checked={sameCustomerBA === ba.id} onClick={() => setSameCustomerBA(ba.id)}>
                  <p className="text-sm font-semibold text-gray-900">{ba.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ba.detail}</p>
                </OptionCard>
              ))}
            </div>
          </>
        ) : newOwner ? (
          /* Selected / created owner */
          <div className="rounded-xl border-2 border-blue-600 bg-blue-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {newOwner.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {newOwner.name}
                {newOwner.isNew && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold uppercase">New customer</span>}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{newOwner.account} · {newOwner.email} · {newOwner.phone}</p>
              {newOwner.isNew && (
                <p className="text-xs text-gray-500 mt-2">On submit, this creates a Consumer account, Contact, Billing account and Service account for the new owner.</p>
              )}
            </div>
            <button onClick={() => { setNewOwner(null); setQuery(''); }} className="text-xs font-semibold text-blue-700 hover:underline flex-shrink-0">Change</button>
          </div>
        ) : creating ? (
          /* Create new customer */
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-900">Create new customer</p>
              <ToConfirm id="UIUX012-Q1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['firstName', 'First name', 'text'],
                ['lastName', 'Last name', 'text'],
                ['email', 'Email', 'email'],
                ['phone', 'Phone', 'tel'],
              ] as const).map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="text-xs text-gray-600 mb-1.5 block">{label} <span className="text-red-500">*</span></span>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setDuplicate(null); }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Service address: {selectedSA?.address}. Creates a Consumer account, Contact, Billing account and Service account.</p>

            {duplicate && (
              <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Possible duplicate customer</p>
                <p className="text-xs text-amber-900 mt-1">
                  <span className="font-semibold">{duplicate.name}</span> ({duplicate.account}) has the same email or phone. Use the existing customer to avoid a duplicate.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setNewOwner(duplicate); setCreating(false); setDuplicate(null); }} className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700">Use {duplicate.name}</button>
                  <button onClick={commitNewCustomer} className="px-4 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-medium hover:bg-amber-100">Create anyway</button>
                </div>
              </div>
            )}

            {!duplicate && (
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => { setCreating(false); setDuplicate(null); }} className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreate} disabled={!formValid}
                  className={`px-5 py-2 rounded-lg text-sm font-bold ${formValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  Create customer
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Search */
          <>
            <SectionTitle>Search customers</SectionTitle>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, email or phone"
                aria-label="Search customers by name, email or phone"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {query.trim().length >= 2 && (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-3">
                {results.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500">No customer matches "{query}".</p>
                ) : results.map(c => (
                  <button key={c.id} onClick={() => setNewOwner(c)} className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 text-left hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">{c.name.split(' ').map(p => p[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.account} · {c.email} · {c.phone}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700">Select</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mb-2">Try "Linda", "Maria" or "555-0388".</p>
            <button onClick={() => { setCreating(true); setDuplicate(null); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 text-sm font-semibold hover:bg-blue-50">
              <UserPlus className="w-4 h-4" /> Create new customer
            </button>
          </>
        )}

        <Footer onBack={() => setStep('requester')} onNext={() => setStep('path-date')} canNext={canNext} />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 3 — Path & effective date
  // ═════════════════════════════════════════════════════════════════════════
  if (step === 'path-date') {
    const canNext = (!hasPhone || keepNumber !== null) && (!showAppointment || (!!apptDate && !!apptSlot));
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        {header('Path and effective date')}

        {/* Path (R4 / UR4) */}
        <SectionTitle>Path</SectionTitle>
        {hasPhone ? (
          <>
            <p className="text-sm text-gray-800 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Does the new owner want to keep the phone number <span className="font-semibold">{profile.phoneNumber}</span>?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3" role="radiogroup" aria-label="Keep phone number">
              <OptionCard checked={keepNumber === true} onClick={() => setKeepNumber(true)}>
                <p className="text-sm font-semibold text-gray-900">Yes, keep the number</p>
                <p className="text-xs text-gray-500 mt-0.5"><span className="font-semibold text-gray-700">Transfer:</span> services move to the new owner with the same number. No 45-day number hold.</p>
              </OptionCard>
              <OptionCard checked={keepNumber === false} onClick={() => setKeepNumber(false)}>
                <p className="text-sm font-semibold text-gray-900">No, not needed</p>
                <p className="text-xs text-gray-500 mt-0.5"><span className="font-semibold text-gray-700">Disconnect + new connect</span> on the same effective date.</p>
              </OptionCard>
            </div>
            {profile.portedIn && keepNumber && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-900 mb-3">
                <TriangleAlert className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">This number was ported in from another provider. Handling of ported-in numbers is not defined yet.</span>
                <ToConfirm id="MACD003-Q6" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 mb-3">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>No phone service at this address, so the path is <span className="font-semibold text-gray-800">disconnect + new connect</span>: the previous owner's services end and the new owner's start on the same date, with no gap.</span>
          </div>
        )}

        {/* Effective date (R9 / UR5) */}
        <div className="mt-8">
          <SectionTitle aside={<ToConfirm id="MACD003-BR9" />}>Effective date</SectionTitle>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Effective date">
            <OptionCard checked={effective === 'today'} onClick={() => setEffective('today')}>
              <p className="text-sm font-semibold text-gray-900">Today</p>
              <p className="text-xs text-gray-500 mt-0.5">{longDate(new Date())}</p>
            </OptionCard>
            <OptionCard checked={effective === 'nextCycle'} onClick={() => setEffective('nextCycle')}>
              <p className="text-sm font-semibold text-gray-900">Next bill cycle</p>
              <p className="text-xs text-gray-500 mt-0.5">{longDate(nextBillCycle())}</p>
            </OptionCard>
          </div>

          {/* Billing cutover (R5 / AC-5) */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 text-xs">
            <Receipt className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gray-500">{PREVIOUS_OWNER.name} billed</p>
              <p className="font-semibold text-gray-900">up to {longDate(dayBefore)}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className="flex-1">
              <p className="text-gray-500">{newOwnerLabel} billed</p>
              <p className="font-semibold text-gray-900">from {longDate(effectiveDate)}</p>
            </div>
          </div>
        </div>

        {/* Outstanding balance (R12 / UR9) */}
        {!isSameCustomer && profile.outstandingBalance > 0 && (
          <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p><span className="font-semibold">{PREVIOUS_OWNER.name} has an outstanding balance of {money(profile.outstandingBalance)}.</span></p>
              <p className="text-xs mt-0.5">It stays with the previous owner. Only the services move to {newOwnerLabel}.</p>
            </div>
            <ToConfirm id="MACD003-Q7" />
          </div>
        )}

        {/* Appointment (R8 / UR6) */}
        <div className="mt-8">
          <SectionTitle>Technician visit</SectionTitle>
          {!showAppointment ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-400" />
                No technician visit is needed unless equipment changes.
              </p>
              <button onClick={() => setShowAppointment(true)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 flex-shrink-0">
                Book appointment
              </button>
            </div>
          ) : (
            <>
              <AppointmentPanel
                title="Equipment change appointment"
                hint="Only book when equipment needs to change. Otherwise no appointment is created."
                date={apptDate}
                slotId={apptSlot}
                onChange={(d, s) => { setApptDate(d); setApptSlot(s); }}
              />
              <button onClick={() => { setShowAppointment(false); setApptDate(''); setApptSlot(null); }} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">
                Remove appointment
              </button>
            </>
          )}
        </div>

        <Footer onBack={() => setStep('new-owner')} onNext={() => setStep('documents')} canNext={canNext} />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 4 — Documents
  // ═════════════════════════════════════════════════════════════════════════
  if (step === 'documents') {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        {header('Supporting documents', 'Optional. Attach anything that supports the change, such as a death certificate or a lease.')}

        <SectionTitle aside={<ToConfirm id="UIUX012-Q4" />}>Documents</SectionTitle>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center"
        >
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-700">Drag files here or{' '}
            <button onClick={() => fileInput.current?.click()} className="font-semibold text-blue-700 hover:underline">browse</button>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG</p>
          <input ref={fileInput} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {docs.length > 0 && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-500">{fmtSize(d.size)}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={d.internal}
                    onChange={e => setDocs(prev => prev.map(x => x.id === d.id ? { ...x, internal: e.target.checked } : x))}
                    className="w-4 h-4 accent-blue-600" />
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  Internal · hidden from customer
                </label>
                <button onClick={() => setDocs(prev => prev.filter(x => x.id !== d.id))} aria-label={`Remove ${d.name}`} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <SectionTitle aside={<ToConfirm id="MACD003-Q9" />}>Previous owner confirmation</SectionTitle>
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white cursor-pointer hover:border-gray-300">
            <input type="checkbox" checked={prevOwnerConfirmed} onChange={e => setPrevOwnerConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">The previous owner (or their estate) confirmed the transfer</p>
              <p className="text-xs text-gray-500 mt-0.5">Today no one signs. If Rightfiber requires it, this becomes a mandatory signed or recorded confirmation.</p>
            </div>
          </label>
        </div>

        <Footer onBack={() => setStep('path-date')} onNext={() => setStep('review')} nextLabel={docs.length ? 'Next' : 'Skip and continue'} />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 5 — Review (UR7)
  // ═════════════════════════════════════════════════════════════════════════
  const orderPlan = path === 'transfer'
    ? [{ type: 'Change of Ownership · Transfer', owner: newOwnerLabel, note: `Moves the services and ${profile.phoneNumber} to the new owner. Reported as an ownership change.` }]
    : [
      { type: 'Disconnect', owner: PREVIOUS_OWNER.name, note: `Ends the previous owner's services on ${longDate(effectiveDate)}.` },
      { type: 'New connect', owner: newOwnerLabel, note: `Starts the new owner's services on ${longDate(effectiveDate)}.` },
    ];

  if (step === 'review') {
    const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div className="grid grid-cols-[180px_1fr] gap-4 px-5 py-3 border-b border-gray-100 last:border-b-0 text-sm">
        <span className="text-gray-500">{label}</span>
        <div className="text-gray-900">{children}</div>
      </div>
    );
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        {header('Review change of ownership')}

        {/* Owners */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Previous owner</p>
            <p className="text-sm font-semibold text-gray-900">{PREVIOUS_OWNER.name}</p>
            <p className="text-xs text-gray-500">{PREVIOUS_OWNER.account} · {profile.billingAccount}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-cyan-600" />
          <div className="rounded-xl border-2 border-cyan-500 bg-cyan-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-700 mb-1">New owner</p>
            <p className="text-sm font-semibold text-gray-900">{isSameCustomer ? PREVIOUS_OWNER.name : newOwner?.name}</p>
            <p className="text-xs text-gray-500">{isSameCustomer ? sameCustomerBA : `${newOwner?.account}${newOwner?.isNew ? ' (created on submit)' : ''}`}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
          <Row label="Address">{selectedSA?.address} <span className="text-gray-500">({selectedSA?.name})</span></Row>
          <Row label="Services">
            <div className="flex flex-wrap gap-1.5">
              {profile.services.map(s => <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-400 text-white font-medium">{s}</span>)}
            </div>
          </Row>
          <Row label="Path">{path === 'transfer' ? `Transfer · keeps ${profile.phoneNumber}` : 'Disconnect + new connect'}</Row>
          <Row label="Effective date">{longDate(effectiveDate)}{effective === 'nextCycle' ? ' (next bill cycle)' : ' (today)'}</Row>
          <Row label="Billing cutover">{PREVIOUS_OWNER.name} up to {longDate(dayBefore)} · {newOwnerLabel} from {longDate(effectiveDate)}</Row>
          {!isSameCustomer && profile.outstandingBalance > 0 && (
            <Row label="Outstanding balance">{money(profile.outstandingBalance)} stays with {PREVIOUS_OWNER.name} <ToConfirm id="MACD003-Q7" /></Row>
          )}
          <Row label="Technician visit">
            {showAppointment && apptDate ? `${formatDateLabel(new Date(apptDate + 'T12:00:00'))} · ${slotLabel(apptSlot)}` : 'None'}
          </Row>
          <Row label="Requester">{requester?.name} · CPNI verified{reason ? ` · Reason: ${reason}` : ''}</Row>
          <Row label="Documents">
            {docs.length === 0 ? 'None' : (
              <ul className="space-y-1">
                {docs.map(d => (
                  <li key={d.id} className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />{d.name}
                    {d.internal && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold inline-flex items-center gap-1"><Lock className="w-3 h-3" />Internal</span>}
                  </li>
                ))}
              </ul>
            )}
            {prevOwnerConfirmed && <p className="text-xs text-gray-500 mt-1">Previous owner confirmed the transfer.</p>}
          </Row>
        </div>

        <SectionTitle>Orders to be created</SectionTitle>
        <div className="flex flex-col gap-2">
          {orderPlan.map(o => (
            <div key={o.type} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${o.type === 'Disconnect' ? 'bg-red-50 text-red-700' : 'bg-cyan-50 text-cyan-700'}`}>{o.type}</span>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{o.owner}</p>
                <p className="text-xs text-gray-500">{o.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 mt-4">
          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>The previous owner's orders, billing history, payments, call history and documents stay with them and aren't visible to the new owner. <ToConfirm id="MACD003-Q8" /></span>
        </div>

        <Footer onBack={() => setStep('documents')} onNext={submit} nextLabel="Submit change of ownership" />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STEP 6 — Confirmation (AC-8)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <ContextBar action="changeOwnership" selectedSA={selectedSA} />
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Change of Ownership Submitted</h1>
        <p className="text-sm text-gray-600">
          Services at <span className="font-semibold">{selectedSA?.address}</span> move from{' '}
          <span className="font-semibold">{PREVIOUS_OWNER.name}</span> to <span className="font-semibold">{newOwnerLabel}</span>.
        </p>
        <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-gray-400" /> Effective <span className="font-semibold">{longDate(effectiveDate)}</span>
        </p>
      </div>

      <SectionTitle><span className="block mt-8">Orders created</span></SectionTitle>
      <div className="flex flex-col gap-2">
        {orderPlan.map((o, i) => (
          <a key={o.type} href="#" onClick={e => e.preventDefault()}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
            <span className="text-sm font-semibold text-blue-700">{orderNumbers[i]}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${o.type === 'Disconnect' ? 'bg-red-50 text-red-700' : 'bg-cyan-50 text-cyan-700'}`}>{o.type}</span>
            <span className="text-sm text-gray-600 flex-1">{o.owner}</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        ))}
      </div>

      <div className="flex justify-end mt-10">
        <button onClick={onFinish} className="px-7 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700">Return to account</button>
      </div>
    </div>
  );
}
