import { Check, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface MoveServicesProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  onBack: () => void;
  onMove: (address: string, scenario: string) => void;
}

const MOVE_SCENARIOS = [
  { value: 'M01', label: 'M01 · Full move — same technology' },
  { value: 'M02', label: 'M02 · Partial move — same technology' },
  { value: 'M03', label: 'M03 · Technology change — fiber → coax' },
  { value: 'M04', label: 'M04 · Offer migration — new address' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export function MoveServices({ action, selectedSA, onBack, onMove }: MoveServicesProps) {
  const [scenario, setScenario] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('IL');
  const [zip, setZip] = useState('');
  const [serviceabilityChecked, setServiceabilityChecked] = useState(false);

  const canCheckServiceability =
    (street.trim() !== '' && city.trim() !== '' && zip.trim() !== '') || scenario !== '';

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={1} />

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">New destination address</h2>

        <div className="flex flex-col gap-5">
          {/* Street */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">
              Street address
            </label>
            <input
              type="text"
              value={street}
              onChange={e => { setStreet(e.target.value); setServiceabilityChecked(false); }}
              placeholder="123 Main St"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* City + State + ZIP */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={e => { setCity(e.target.value); setServiceabilityChecked(false); }}
                placeholder="Springfield"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm text-gray-700 mb-1.5">State</label>
              <select
                value={state}
                onChange={e => { setState(e.target.value); setServiceabilityChecked(false); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-sm text-gray-700 mb-1.5">ZIP code</label>
              <input
                type="text"
                value={zip}
                onChange={e => { setZip(e.target.value); setServiceabilityChecked(false); }}
                placeholder="62701"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Serviceability results — M03 */}
        {serviceabilityChecked && scenario === 'M03' && (
          <div className="mt-6">
            <hr className="border-gray-200 mb-5" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Serviceability Check</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Fiber not available
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Coax (HFC) available
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Voice portable
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Tech change required
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-700">Fiber unavailable at destination. Only M03 (technology change) is available.</span>
            </div>
          </div>
        )}

        {/* Serviceability results — M04 */}
        {serviceabilityChecked && scenario === 'M04' && (
          <div className="mt-6">
            <hr className="border-gray-200 mb-5" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Serviceability Check</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Fiber available
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Voice portable
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                <Info className="w-3.5 h-3.5" /> Offer migration available
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#faf0fa] rounded-lg border border-[#d9a0d9]">
              <Info className="w-4 h-4 text-[#800080] flex-shrink-0" />
              <span className="text-sm text-[#800080]">Fiber available at destination. Replacement offers are available — agent must select the new plan.</span>
            </div>
          </div>
        )}

        {/* Serviceability results — M01 / M02 */}
        {serviceabilityChecked && (scenario === 'M01' || scenario === 'M02') && (
          <div className="mt-6">
            <hr className="border-gray-200 mb-5" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Serviceability Check</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Fiber available
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" /> Voice portable
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Buried drop — 10 biz days
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-700">Same technology available — full and partial moves are available.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end gap-3 mt-10">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => canCheckServiceability && setServiceabilityChecked(true)}
            disabled={!canCheckServiceability}
            className={`px-6 py-2.5 rounded-full text-sm font-medium border transition-colors
              ${canCheckServiceability
                ? 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                : 'border-gray-300 text-gray-400 bg-white cursor-not-allowed'
              }`}
          >
            Check serviceability
          </button>
          <button
            onClick={() => onMove(`${street}, ${city}, ${state} ${zip}`, scenario)}
            disabled={!serviceabilityChecked}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
              ${serviceabilityChecked
                ? 'bg-[#800080] text-white hover:bg-[#6a006a]'
                : 'bg-[#c9a0c9] text-white cursor-not-allowed'
              }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Demo scenario selector */}
      <div className="flex items-center gap-3 mt-6 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl">
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase flex-shrink-0">Demo</span>
        <select
          value={scenario}
          onChange={e => {
            const val = e.target.value;
            setScenario(val);
            setServiceabilityChecked(false);
            if (val === 'M04') {
              setStreet('850 N 96th St');
              setCity('Omaha');
              setState('NE');
              setZip('68114');
            } else if (val) {
              setStreet('450 Birchwood Ave');
              setCity('Springfield');
              setState('IL');
              setZip('62704');
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-[#800080]"
        >
          <option value="">LOAD ESCENARIO</option>
          {MOVE_SCENARIOS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

    </div>
  );
}
