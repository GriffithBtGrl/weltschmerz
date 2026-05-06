const variants = {
  primary:  'bg-neon-blue/10 border border-neon-blue text-neon-blue hover:bg-neon-blue/20',
  magenta:  'bg-neon-magenta/10 border border-neon-magenta text-neon-magenta hover:bg-neon-magenta/20',
  ghost:    'bg-transparent border border-dark-600 text-gray-400 hover:border-gray-500 hover:text-gray-200',
  danger:   'bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500/20',
};

const sizes = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={`
        font-mono rounded transition-all duration-150 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Cargando...
        </span>
      ) : children}
    </button>
  );
};

export default Button;