import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Button } from './FormField';

interface StepLayoutProps {
  stepNum: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  canContinue?: boolean;
  continueLabel?: string;
  continueHint?: string;
  onContinue?: () => void;
  hideNav?: boolean;
}

export function StepLayout({
  stepNum,
  title,
  subtitle,
  children,
  canContinue = true,
  continueLabel = 'Pokračovať →',
  continueHint,
  onContinue,
  hideNav = false,
}: StepLayoutProps) {
  const { currentStep, nextStep, prevStep } = useProjectStore();

  const handleContinue = () => {
    if (onContinue) onContinue();
    else nextStep();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step header */}
      <div className="rounded-lg overflow-hidden mb-6 shadow-sm border border-slate-800">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="font-mono text-sm font-bold bg-green-600 text-white px-3 py-1.5 rounded flex-shrink-0 tracking-widest">
              {String(stepNum).padStart(2, '0')}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h1>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i + 1 === stepNum
                    ? 'w-7 bg-green-400'
                    : i + 1 < stepNum
                    ? 'w-2 bg-green-600'
                    : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">{children}</div>

      {/* Navigation */}
      {!hideNav && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep <= 1}
          >
            ← Späť
          </Button>

          <div className="flex items-center gap-4">
            {continueHint && !canContinue && (
              <span className="text-sm text-amber-700 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-400 rounded-full inline-block flex-shrink-0" />
                {continueHint}
              </span>
            )}
            {currentStep < 10 && (
              <Button
                variant="primary"
                onClick={handleContinue}
                disabled={!canContinue}
                title={!canContinue ? continueHint : undefined}
              >
                {continueLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
