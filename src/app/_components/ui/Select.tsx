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
        className={`rounded-xl border border-wise-border bg-white px-4 py-3 text-wise-content outline-none focus:border-wise-forest ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
