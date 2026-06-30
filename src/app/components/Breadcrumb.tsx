interface BreadcrumbProps {
  steps: string[];
  currentIndex: number;
}

export function Breadcrumb({ steps, currentIndex }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6" aria-label="Breadcrumb">
      {steps.slice(0, currentIndex + 1).map((step, i) => (
        <span key={step} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-gray-400 select-none">›</span>
          )}
          <span className={
            i === currentIndex
              ? 'font-bold text-[#0D2B4E]'
              : 'text-[#1E5FA8]'
          }>
            {step}
          </span>
        </span>
      ))}
    </nav>
  );
}
