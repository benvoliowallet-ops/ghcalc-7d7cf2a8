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
      <div className="overflow-hidden mb-6 border border-border bg-secondary" style={{ borderRadius: 'var(--radius)' }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="font-mono text-sm font-bold bg-primary text-primary-foreground px-3 py-1.5 flex-shrink-0 tracking-widest"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {String(stepNum).padStart(2, '0')}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase">{title}</h1>
              {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="h-1 transition-all"
                style={{
                  borderRadius: 'var(--radius)',
                  width: i + 1 === stepNum ? '28px' : '8px',
                  backgroundColor: i + 1 === stepNum
                    ? 'hsl(var(--primary))'
                    : i + 1 < stepNum
                    ? 'hsl(var(--primary) / 0.5)'
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">{children}</div>

      {/* Navigation */}
      {!hideNav && (
        <div
          className="bg-card border border-border p-4 flex items-center justify-between"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep <= 1}
          >
            ← Späť
          </Button>

          <div className="flex items-center gap-4">
            {continueHint && !canContinue && (
              <span className="text-sm text-orange flex items-center gap-2">
                <span className="w-1 h-4 bg-orange rounded-full inline-block flex-shrink-0" />
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
