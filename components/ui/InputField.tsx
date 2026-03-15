"use client";

import type { ReactNode } from "react";

interface InputFieldProps {
  icon: ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  endIcon?: ReactNode;
  onEndIconClick?: () => void;
}

export default function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  endIcon,
  onEndIconClick,
}: InputFieldProps) {
  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-4 text-slate-400">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 bg-[#1E293B] border border-[#334155] rounded-lg pl-12 pr-12 text-white placeholder-slate-400 text-sm outline-none focus:border-[#F3DE3D] focus:ring-1 focus:ring-[#F3DE3D] transition-colors"
      />
      {endIcon && (
        <button
          type="button"
          onClick={onEndIconClick}
          className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {endIcon}
        </button>
      )}
    </div>
  );
}
