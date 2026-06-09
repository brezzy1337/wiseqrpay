import { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function Select({
  label,
  id,
  name,
  className = "",
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-wise-secondary"
      >
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className={`rounded-wise-sm border border-wise-border bg-white px-4 py-3.5 text-wise-content outline-none transition focus:border-wise-forest focus:ring-4 focus:ring-wise-green/40 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
