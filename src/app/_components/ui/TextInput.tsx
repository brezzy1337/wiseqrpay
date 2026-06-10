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
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-wise-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`rounded-wise-sm border bg-white px-4 py-3 text-wise-content outline-none transition placeholder:text-wise-tertiary focus:border-wise-forest focus:ring-4 focus:ring-wise-green/40 ${error ? "border-wise-negative" : "border-wise-border"} ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-wise-negative">{error}</p> : null}
    </div>
  );
}
