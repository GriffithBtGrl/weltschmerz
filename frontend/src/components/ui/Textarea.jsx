const Textarea = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`
          bg-dark-950 border text-gray-200 rounded px-3 py-2 w-full
          font-mono text-sm placeholder-gray-600 resize-none
          focus:outline-none focus:ring-1 transition-colors duration-150
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            : 'border-dark-600 focus:border-neon-blue focus:ring-neon-blue/30'
          }
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
    </div>
  );
};

export default Textarea;