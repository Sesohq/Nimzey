import { useState, useEffect, useRef } from 'react';

interface IsolatedHexInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function IsolatedHexInput({ value, onChange, disabled, placeholder = "#ffffff" }: IsolatedHexInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Validate and format the hex color on blur
    if (/^#[0-9A-F]{6}$/i.test(inputValue) || /^#[0-9A-F]{3}$/i.test(inputValue)) {
      // Valid hex color
      if (inputValue.length === 4) {
        // Convert 3-digit hex to 6-digit
        const fullHex = '#' + inputValue[1] + inputValue[1] + inputValue[2] + inputValue[2] + inputValue[3] + inputValue[3];
        setLocalValue(fullHex);
        onChange(fullHex);
      }
    } else if (!inputValue.startsWith('#')) {
      // Add # if missing
      const withHash = '#' + inputValue;
      if (/^#[0-9A-F]{6}$/i.test(withHash) || /^#[0-9A-F]{3}$/i.test(withHash)) {
        setLocalValue(withHash);
        onChange(withHash);
      }
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Force focus on the input
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const handleInputMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    (e.target as HTMLInputElement).select();
  };

  return (
    <div
      ref={containerRef}
      className="nodrag flex-1"
      onMouseDown={handleContainerMouseDown}
      style={{ 
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onMouseDown={handleInputMouseDown}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        disabled={disabled}
        draggable={false}
        spellCheck={false}
        autoComplete="off"
        className="nodrag w-full text-xs font-mono px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        placeholder={placeholder}
        style={{
          pointerEvents: 'auto',
          cursor: 'text',
          userSelect: 'text'
        }}
      />
    </div>
  );
}