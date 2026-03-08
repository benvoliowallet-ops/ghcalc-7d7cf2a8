import React from 'react';

interface FormFieldProps {
  label: string;
  unit?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormField({ label, unit, hint, children, required }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {unit && <span className="text-muted-foreground font-normal ml-1">[{unit}]</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, unit, hint, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-1">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
          {unit && <span className="text-muted-foreground font-normal ml-1">[{unit}]</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors ${
            error ? 'border-destructive' : 'border-border'
          } ${className}`}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  unit?: string;
  hint?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, unit, hint, options, className = '', ...props }: SelectProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-1">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
          {unit && <span className="text-muted-foreground font-normal ml-1">[{unit}]</span>}
        </label>
      )}
      <select
        className={`w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'calc';
}

export function Card({ title, subtitle, children, className = '', variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-card border border-border',
    info:    'bg-card border border-border border-t-4 border-t-primary',
    warning: 'bg-card border border-border border-t-4 border-t-orange',
    success: 'bg-card border border-border border-t-4 border-t-teal',
    calc:    'bg-muted border border-border',
  };

  return (
    <div className={`rounded p-5 ${variants[variant]} ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface CalcRowProps {
  label: string;
  value: string | number;
  unit?: string;
  formula?: string;
  highlight?: boolean;
}

export function CalcRow({ label, value, unit, formula, highlight }: CalcRowProps) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-border last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <div>
        <span className="text-sm text-foreground">{label}</span>
        {formula && <span className="ml-2 text-xs text-primary font-mono">{formula}</span>}
      </div>
      <div className="text-sm font-mono">
        <span className={highlight ? 'text-teal font-bold' : 'text-foreground'}>
          {typeof value === 'number' ? value.toLocaleString('sk-SK', { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && <span className="text-muted-foreground ml-1 text-xs">{unit}</span>}
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'teal' | 'orange' | 'red' | 'navy' | 'muted' | 'green' | 'amber' | 'blue' | 'purple';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const variants: Record<string, string> = {
    gray:   'bg-muted text-muted-foreground',
    muted:  'bg-muted text-muted-foreground',
    teal:   'bg-teal/10 text-teal',
    green:  'bg-teal/10 text-teal',       // alias → teal
    orange: 'bg-orange/10 text-orange',
    amber:  'bg-orange/10 text-orange',   // alias → orange
    red:    'bg-destructive/10 text-destructive',
    navy:   'bg-secondary/10 text-secondary',
    blue:   'bg-primary/10 text-primary', // alias → primary/teal
    purple: 'bg-orange/10 text-orange',   // alias → orange
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:   'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm',
    secondary: 'bg-card hover:bg-muted text-foreground border border-border',
    danger:    'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    ghost:     'hover:bg-muted text-muted-foreground',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`inline-flex items-center gap-2 font-semibold rounded transition-colors ${variants[variant]} ${sizes[size]} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function PrintIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function DownloadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
}
