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
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {unit && <span className="text-gray-400 font-normal ml-1">[{unit}]</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
          {unit && <span className="text-gray-400 font-normal ml-1">[{unit}]</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            error ? 'border-red-400' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
          {unit && <span className="text-gray-400 font-normal ml-1">[{unit}]</span>}
        </label>
      )}
      <select
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
    default: 'bg-white border border-gray-200',
    info:    'bg-white border border-gray-200 border-t-4 border-t-blue-500',
    warning: 'bg-white border border-gray-200 border-t-4 border-t-amber-400',
    success: 'bg-white border border-gray-200 border-t-4 border-t-green-600',
    calc:    'bg-slate-50 border border-slate-200',
  };

  return (
    <div className={`rounded-lg p-5 ${variants[variant]} ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
    <div className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {formula && <span className="ml-2 text-xs text-indigo-500 font-mono">{formula}</span>}
      </div>
      <div className="text-sm font-mono">
        <span className={highlight ? 'text-green-700 font-bold' : 'text-gray-900'}>
          {typeof value === 'number' ? value.toLocaleString('sk-SK', { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && <span className="text-gray-400 ml-1 text-xs">{unit}</span>}
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const variants = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
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
    primary: 'bg-green-700 hover:bg-green-800 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-600',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${
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
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
