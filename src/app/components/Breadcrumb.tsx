interface BreadcrumbProps {
  steps: string[];
  currentIndex: number;
  /** 'link' (default): only completed + current steps shown, in the app's blue/navy style.
   *  'plain': all steps shown up front (current bold black, rest gray) — used by flows
   *  that want to preview the full journey from the first screen (e.g. Follow On Order). */
  variant?: 'link' | 'plain';
}

export function Breadcrumb({ steps, currentIndex, variant = 'link' }: BreadcrumbProps) {
  const visibleSteps = variant === 'plain' ? steps : steps.slice(0, currentIndex + 1);
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6" aria-label="Breadcrumb">
      {visibleSteps.map((step, i) => (
        <span key={step} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-gray-400 select-none">›</span>
          )}
          <span className={
            variant === 'plain'
              ? (i === currentIndex ? 'font-bold text-gray-900' : 'text-gray-400')
              : (i === currentIndex ? 'font-bold text-[#0D2B4E]' : 'text-[#1E5FA8]')
          }>
            {step}
          </span>
        </span>
      ))}
    </nav>
  );
}
