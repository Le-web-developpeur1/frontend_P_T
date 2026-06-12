export default function Button({
    children, onClick, type = 'button',
    variant = 'primary', size = 'md',
    disabled = false, loading = false, className = ''
  }) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
    const variants = {
      primary:   'bg-blue-900 text-white hover:bg-blue-800 active:scale-95',
      secondary: 'bg-yellow-500 text-blue-900 hover:bg-yellow-400 active:scale-95',
      danger:    'bg-red-600 text-white hover:bg-red-500 active:scale-95',
      ghost:     'bg-transparent text-blue-900 border border-blue-900 hover:bg-blue-50 active:scale-95',
      success:   'bg-green-600 text-white hover:bg-green-500 active:scale-95',
    };
  
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
  
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }