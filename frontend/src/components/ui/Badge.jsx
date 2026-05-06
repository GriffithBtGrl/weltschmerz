const variants = {
  blue:    'bg-neon-blue/10 text-neon-blue border border-neon-blue/30',
  magenta: 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30',
  green:   'bg-neon-green/10 text-neon-green border border-neon-green/30',
  gray:    'bg-dark-700 text-gray-400 border border-dark-600',
};

const Badge = ({ children, variant = 'blue', className = '' }) => {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded text-xs font-mono
      ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
};

export default Badge;