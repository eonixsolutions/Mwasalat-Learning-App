import { cn } from '../../utils/cn.js';
import Spinner from './Spinner.jsx';

const variants = {
  primary: 'bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white focus:ring-coral-300',
  secondary: 'bg-white hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] focus:ring-[#CBD5E1]',
  danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  ghost: 'text-coral-500 hover:bg-coral-100 focus:ring-coral-300',
  outline: 'border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] focus:ring-[#CBD5E1]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}
