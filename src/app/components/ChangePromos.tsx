import { HelpCircle } from 'lucide-react';

export const PROMOS = [
  { id: 'price-lock',  label: 'Price Lock',  description: 'Guaranteed rate for 12 months',      discount: 0 },
  { id: 'apply-promo', label: 'Apply Promo', description: 'First 3 months at promotional rate', discount: 9 },
];

interface PromoSectionProps {
  selectedPromos: Set<string>;
  onToggle: (id: string) => void;
  promoIds?: string[];
  automaticPromoIds?: string[];
}

export function PromoSection({ selectedPromos, onToggle, promoIds, automaticPromoIds = [] }: PromoSectionProps) {
  const visiblePromos = promoIds ? PROMOS.filter(p => promoIds.includes(p.id)) : PROMOS;
  const automaticPromos = PROMOS.filter(p => automaticPromoIds.includes(p.id));

  return (
    <div className="border-t border-gray-100 pt-3 mt-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Promotions</p>
      <div className="space-y-2">
        {/* Automatic (disabled, pre-checked) promos */}
        {automaticPromos.map(promo => (
          <div key={`auto-${promo.id}`} className="w-full flex items-start gap-2.5 opacity-60 cursor-default">
            <div className="mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center bg-indigo-600 border-indigo-600">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-800">{promo.label}</p>
              <div className="relative group">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-default" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50">
                  {promo.description}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Interactive promos */}
        {visiblePromos.map(promo => {
          const checked = selectedPromos.has(promo.id);
          return (
            <button
              key={promo.id}
              onClick={() => onToggle(promo.id)}
              className="w-full flex items-start gap-2.5 text-left"
            >
              <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                {checked && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-800">{promo.label}</p>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-default" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50">
                    {promo.description}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
