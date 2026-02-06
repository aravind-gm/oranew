'use client';

/**
 * ORA Admin Panel - UI Components Library
 * =======================================
 * 
 * Reusable UI components for the admin panel
 * Enterprise-grade, accessible, and themed
 */

import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Loader2, Check, AlertCircle, AlertTriangle, Info, X, ChevronDown } from 'lucide-react';

// ============================================
// BUTTON COMPONENT
// ============================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // REDESIGNED: Professional, readable buttons
  // Primary = Luxury gold (warm, premium)
  // Secondary = White with subtle border (professional)
  // Ghost = Minimalist (for non-critical actions)
  const variants = {
    primary: 'bg-[#d4af37] text-white hover:bg-[#b8962e] focus:ring-[#fde8b3]',
    secondary: 'bg-white text-[#111827] border border-[#d1d5db] hover:bg-[#f6f7f9] focus:ring-[#fde8b3]',
    gold: 'bg-[#d4af37] text-white hover:bg-[#b8962e] focus:ring-[#fde8b3]',
    ghost: 'text-[#4b5563] hover:bg-[#f6f7f9] hover:text-[#111827] focus:ring-[#fde8b3]',
    danger: 'bg-[#dc2626] text-white hover:bg-[#b91c1c] focus:ring-[#fecaca]',
    success: 'bg-[#16a34a] text-white hover:bg-[#15803d] focus:ring-[#bbf7d0]',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-[#111827]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2.5 text-sm rounded-lg border transition-all
            bg-white text-[#111827]
            placeholder:text-[#9ca3af]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error 
              ? 'border-[#dc2626] focus:ring-[#fecaca] focus:border-[#dc2626]' 
              : 'border-[#d1d5db] focus:ring-[#fde8b3] focus:border-[#d4af37]'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[#dc2626] flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-[#9ca3af]">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================
// TEXTAREA COMPONENT
// ============================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block mb-1.5 text-sm font-medium text-[#111827]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          w-full px-3 py-2.5 text-sm rounded-lg border transition-all resize-none
          bg-white text-[#111827]
          placeholder:text-[#9ca3af]
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error 
            ? 'border-[#dc2626] focus:ring-[#fecaca]' 
            : 'border-[#d1d5db] focus:ring-[#fde8b3] focus:border-[#d4af37]'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#dc2626] flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-[#9ca3af]">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1.5 text-sm font-medium text-[#111827]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-3 py-2.5 text-sm rounded-lg border transition-all appearance-none
            bg-white text-[#111827]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error 
              ? 'border-[#dc2626] focus:ring-[#fecaca]' 
              : 'border-[#d1d5db] focus:ring-[#fde8b3] focus:border-[#d4af37]'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" 
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[#dc2626] flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-[#9ca3af]">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ============================================
// CHECKBOX COMPONENT
// ============================================

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            w-4 h-4 rounded border-[#d1d5db]
            text-[#d4af37] 
            focus:ring-[#d4af37] focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          {...props}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-[#111827] cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-sm text-[#9ca3af]">{description}</span>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// ============================================
// BADGE COMPONENT
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ children, variant = 'primary', size = 'md', dot = false }: BadgeProps) {
  // REDESIGNED: Light background + dark text for high contrast (Shopify style)
  // No neon colors - all colors have WCAG AAA compliance
  const variants = {
    // Light bg + dark text for status indicators
    primary: 'bg-[#fffbf0] text-[#8b6914] border border-[#fde8b3]',
    secondary: 'bg-[#f6f7f9] text-[#374151] border border-[#e5e7eb]',
    success: 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]',
    warning: 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]',
    error: 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]',
    info: 'bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]',
    gold: 'bg-[#fffbf0] text-[#6b540d] border border-[#fde8b3]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-0.5 text-sm font-medium',
  };

  // Dot color - slightly darker than background
  const dotColors = {
    primary: 'bg-[#b8941f]',
    secondary: 'bg-[#4b5563]',
    success: 'bg-[#15803d]',
    warning: 'bg-[#d97706]',
    error: 'bg-[#b91c1c]',
    info: 'bg-[#2563eb]',
    gold: 'bg-[#b8941f]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl border border-[#e5e7eb] shadow-sm
        ${paddings[padding]}
        ${hover ? 'hover:shadow-md hover:border-[#d1d5db] transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[#111827] ${className}`}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-[#9ca3af] ${className}`}>
      {children}
    </p>
  );
}

// ============================================
// ALERT COMPONENT
// ============================================

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ children, variant = 'info', title, dismissible = false, onDismiss }: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-[#dbeafe]',
      border: 'border-[#3b82f6]',
      text: 'text-[#1d4ed8]',
      icon: <Info size={20} className="text-[#3b82f6]" />,
    },
    success: {
      bg: 'bg-[#dcfce7]',
      border: 'border-[#22c55e]',
      text: 'text-[#15803d]',
      icon: <Check size={20} className="text-[#22c55e]" />,
    },
    warning: {
      bg: 'bg-[#fef3c7]',
      border: 'border-[#f59e0b]',
      text: 'text-[#b45309]',
      icon: <AlertTriangle size={20} className="text-[#f59e0b]" />,
    },
    error: {
      bg: 'bg-[#fef2f2]',
      border: 'border-[#dc2626]',
      text: 'text-[#b91c1c]',
      icon: <AlertCircle size={20} className="text-[#dc2626]" />,
    },
  };

  const style = variants[variant];

  return (
    <div className={`${style.bg} ${style.text} border-l-4 ${style.border} rounded-r-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gold';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
}

export function StatCard({ title, value, change, icon, variant = 'default', trend, subtitle }: StatCardProps) {
  // REDESIGNED FOR EXTREME READABILITY (Shopify style)
  // Color hierarchy: Large numbers (dark) > Small labels (gray) > Meta (lighter gray)
  // All cards are WHITE with subtle left border for accent
  const variants = {
    default: 'bg-white border-l-4 border-l-[#d1d5db]',
    primary: 'bg-white border-l-4 border-l-[#d4af37]',
    success: 'bg-white border-l-4 border-l-[#16a34a]',
    warning: 'bg-white border-l-4 border-l-[#f59e0b]',
    error: 'bg-white border-l-4 border-l-[#dc2626]',
    gold: 'bg-white border-l-4 border-l-[#d4af37]',
  };

  // Soft, tinted backgrounds for icons - never harsh colors
  const iconBgColors = {
    default: 'bg-[#f6f7f9]',
    primary: 'bg-[#fffbf0]',
    success: 'bg-[#f0fdf4]',
    warning: 'bg-[#fffbeb]',
    error: 'bg-[#fef2f2]',
    gold: 'bg-[#fef7e0]',
  };

  // Dark text for icons - ensures readability on light bg
  const iconColors = {
    default: 'text-[#4b5563]',
    primary: 'text-[#b8962e]',
    success: 'text-[#15803d]',
    warning: 'text-[#b45309]',
    error: 'text-[#b91c1c]',
    gold: 'text-[#b8962e]',
  };

  return (
    <div className={`p-6 rounded-xl border border-[#e5e7eb] shadow-sm ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* LABEL: Small, gray - visual hierarchy tier 2 */}
          <p className="text-sm font-medium text-[#4b5563] tracking-wide">
            {title}
          </p>
          
          {/* VALUE: LARGEST, DARKEST, BOLDEST - visual hierarchy tier 1 */}
          <p className="mt-3 text-4xl font-bold text-[#111827] leading-tight">
            {value}
          </p>
          
          {/* SUBTITLE: Tertiary info - visual hierarchy tier 3 */}
          {subtitle && (
            <p className="mt-1 text-sm text-[#6b7280]">
              {subtitle}
            </p>
          )}
          
          {/* TREND: Green/red text only, no pills - clean, professional */}
          {change && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${
                change.trend === 'up' 
                  ? 'text-[#16a34a]'
                  : change.trend === 'down'
                  ? 'text-[#dc2626]'
                  : 'text-[#9ca3af]'
              }`}>
                {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : ''}
                {Math.abs(change.value)}%
              </span>
              <span className="text-sm text-[#9ca3af]">
                vs last period
              </span>
            </div>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-medium ${
                trend.direction === 'up' 
                  ? 'text-[#16a34a]'
                  : trend.direction === 'down'
                  ? 'text-[#dc2626]'
                  : 'text-[#9ca3af]'
              }`}>
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : ''}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-[#9ca3af]">
                vs last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconBgColors[variant]}`}>
            <div className={iconColors[variant]}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-[#f6f7f9] flex items-center justify-center text-[#9ca3af]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#111827] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#9ca3af] mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizes[size]} border-2 border-[#e9dca7] border-t-[#d4af37] rounded-full animate-spin ${className}`}
    />
  );
}

// ============================================
// PAGE HEADER
// ============================================

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-[#9ca3af] mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-[#111827] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[#111827]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[#9ca3af]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// Export all components
export default {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Alert,
  StatCard,
  EmptyState,
  Spinner,
  PageHeader,
};
