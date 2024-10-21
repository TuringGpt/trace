/* eslint-disable react/require-default-props */
import React from 'react';

interface RadioLabelProps {
  id: string;
  value: number;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
}

export default function RadioLabel({
  id,
  value,
  checked,
  onChange,
  label,
  disabled = false,
}: RadioLabelProps) {
  return (
    <label
      className={`flex items-center space-x-2 ${disabled ? 'opacity-50' : ''}`}
      htmlFor={id}
    >
      <div className="relative">
        <input
          id={id}
          type="radio"
          name="timer"
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="appearance-none h-5 w-5 border-2 border-gray-200 rounded-sm checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {checked && (
          <svg
            className="absolute inset-0 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth="5"
              d="M4 12l6 6L20 6"
            />
          </svg>
        )}
      </div>
      <span className="text-xl">{label}</span>
    </label>
  );
}
