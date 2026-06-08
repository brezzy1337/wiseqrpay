import { type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextInput({
  label,
  error,
  id,
  name,
  className = "",
  ...props
}: TextInputProps) {
  const inputId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-wise-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`rounded-xl border bg-white px-4 py-3 text-wise-content outline-none placeholder:text-wise-tertiary focus:border-wise-forest ${error ? "border-wise-negative" : "border-wise-border"} ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-wise-negative">{error}</p> : null}
    </div>
  );
}
