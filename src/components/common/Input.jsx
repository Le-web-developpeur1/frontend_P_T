export default function Input({
    label, name, type = 'text', value, onChange,
    placeholder = '', error = '', required = false,
    disabled = false, className = ''
  }) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`px-3 py-2 border rounded-lg text-sm outline-none transition-all
            ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-100'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }