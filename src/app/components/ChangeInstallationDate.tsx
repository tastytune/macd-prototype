import { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import type { Service, CartLine } from '../App';
import { AppointmentPanel, formatDateLabel, slotLabel } from './AppointmentPanel';
import { PromoSection, PROMOS } from './ChangePromos';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface ChangeInstallationDateProps {
  selectedSA?: Service | null;
  cartLines: CartLine[];
  isDowngrade?: boolean;
  isUpgrade?: boolean;
  isMove2?: boolean;
  action?: string;
  scenario?: string;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: (date: string, slot: string, originDate?: string, originSlot?: string) => void;
}

export function ChangeInstallationDate({ selectedSA, cartLines, isDowngrade, isUpgrade, isMove2 = false, action, scenario, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangeInstallationDateProps) {
  // Every action schedules two appointments: disconnect + install.
  const isAddLocation = action === 'addLocation';
  const isFollowOn = action === 'followOnOrder';
  const isDualSchedule = true;
  // Install appointment (all actions)
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Disconnect appointment at origin (dual-schedule Move only)
  const [originDate, setOriginDate] = useState<string>('');
  const [originSlotId, setOriginSlotId] = useState<string | null>(null);

  const [moveFeeApplied, setMoveFeeApplied] = useState(true);

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">{isAddLocation ? 'Add On New Location' : isMove2 ? 'Move Service' : isFollowOn ? 'Follow-On Order' : 'Change Service'}</h1>
        <ContextBar action={isAddLocation ? 'addLocation' : isMove2 ? 'move2' : isFollowOn ? 'followOnOrder' : 'change'} selectedSA={selectedSA} />
      </div>
      {isFollowOn ? (
        <Breadcrumb
          steps={['Follow-On Order', 'Service Type', 'Plan', 'Installation', 'Review Order', 'Confirmation']}
          currentIndex={3}
          variant="plain"
        />
      ) : (
        <Breadcrumb
          steps={(isMove2 || isAddLocation)
            ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
            : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
          currentIndex={(isMove2 || isAddLocation) ? 4 : 3}
        />
      )}

      <div className="flex gap-8 items-start">

        {/* ── Left: date picker ── */}
        <div className="flex-1 min-w-0">

          {/* Section header + Skip */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {isDualSchedule ? 'Work Order Schedule' : 'Installation Date'}
              </h2>
            </div>
            <button
              onClick={onSkip}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
            >
              Skip Appointment
            </button>
          </div>

          {isDualSchedule ? (
            <div className="grid grid-cols-2 gap-6 mb-8">
              <AppointmentPanel
                tone="orange"
                title="Preferred Disconnect Date"
                hint={isMove2 ? 'Disconnection at origin address' : isAddLocation ? 'Disconnection of any service being replaced at this location' : 'Disconnection of the current service'}
                date={originDate}
                slotId={originSlotId}
                onChange={(d, sl) => { setOriginDate(d); setOriginSlotId(sl); }}
              />
              <AppointmentPanel
                tone="blue"
                title="Preferred Installation Date"
                hint={isMove2 ? 'New service install at destination.' : isAddLocation ? 'Installation of the new service at the new location' : 'Installation of the new service'}
                date={selectedDate}
                slotId={selectedSlotId}
                onChange={(d, sl) => { setSelectedDate(d); setSelectedSlotId(sl); }}
              />
            </div>
          ) : (
            <div className="max-w-xl mb-8">
              <AppointmentPanel
                tone="blue"
                title="Preferred Installation Date"
                hint="Available dates: Weekdays only, up to 30 days in advance"
                date={selectedDate}
                slotId={selectedSlotId}
                min={new Date().toISOString().split('T')[0]}
                onChange={(d, sl) => { setSelectedDate(d); setSelectedSlotId(sl); }}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onBack}
              className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                onNext(selectedDate, slotLabel(selectedSlotId), isDualSchedule ? originDate : undefined, isDualSchedule ? slotLabel(originSlotId) : undefined);
              }}
              className="px-7 py-2.5 rounded-lg text-sm font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>

        {/* ── Right: Order summary ── */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Order Summary</h3>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Service Address</p>
              <div className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-snug">{saAddress}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Monthly Recurring Charges
              </p>
              {cartLines.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {cartLines.map((line, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{line.label}</span>
                      <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {(isDowngrade || isUpgrade) && onPromoToggle && (
                    <PromoSection
                      selectedPromos={selectedPromos}
                      onToggle={onPromoToggle}
                      promoIds={isUpgrade ? ['apply-promo'] : undefined}
                      automaticPromoIds={isUpgrade ? ['price-lock'] : []}
                    />
                  )}
                  {(() => {
                    const discount = PROMOS.filter(p => selectedPromos.has(p.id) && p.discount > 0).reduce((s, p) => s + p.discount, 0);
                    const base = cartLines.reduce((s, l) => s + l.price, 0);
                    return (
                      <div className="border-t border-gray-100 pt-2 space-y-1.5">
                        {discount > 0 && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span>Promo discount</span>
                            <span className="font-medium">−${discount.toFixed(2)}</span>
                          </div>
                        )}
                        {isMove2 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">Move fee (one-time)</span>
                              <button
                                onClick={() => setMoveFeeApplied(v => !v)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${moveFeeApplied ? 'bg-blue-600' : 'bg-gray-200'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${moveFeeApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                              </button>
                            </div>
                            <span className={moveFeeApplied ? 'text-gray-900' : 'text-gray-400 line-through'}>$65.00</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-700">Total</span>
                          <span className="text-gray-900">${(base - discount + (isMove2 && moveFeeApplied ? 65 : 0)).toFixed(2)}/mo</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>

            {selectedSlotId && (
              <>
                <div className="border-t border-gray-100 my-4" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Installation Appointment
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {formatDateLabel(new Date(selectedDate + 'T12:00:00'))}
                  </p>
                  <p className="text-sm text-gray-500">
                    {slotLabel(selectedSlotId)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
