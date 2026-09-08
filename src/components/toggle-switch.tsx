"use client";
import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: ToggleSwitchProps): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-16 shrink-0  rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary cursor-pointer" : "bg-gray-500 opacity-50"
      }`}
    >
      <span
        className={`absolute top-1 h-7 w-7 rounded-full  shadow-md transition-transform duration-200 ${
          checked ? "translate-x-0 bg-[#E9D9FB]" : "-translate-x-7 bg-muted"
        }`}
      />
    </button>
  );
}