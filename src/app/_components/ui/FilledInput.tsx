import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

// Redesign input shell: r12, filled neutral (fills instead of borders),
// label-inside — 12px tertiary label above the 16px value.
const SHELL =
  "flex w-full flex-col gap-0.5 rounded-xl bg-wise-neutral px-4 py-2 text-left transition focus-within:ring-2 focus-within:ring-wise-forest";
const LABEL = "text-xs text-wise-tertiary";
const VALUE =
  "w-full bg-transparent text-base text-wise-content outline-none placeholder:text-wise-tertiary";
const CAPTION = "text-[13px] text-wise-tertiary";
const ERROR = "text-[13px] text-wise-negative";

function FieldShell({
  label,
  helper,
  error,
  inputId,
  className,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  inputId?: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={inputId} className={SHELL}>
        <span className={LABEL}>{label}</span>
        {children}
      </label>
      {error ? (
        <p className={ERROR}>{error}</p>
      ) : helper ? (
        <p className={CAPTION}>{helper}</p>
      ) : null}
    </div>
  );
}

interface FilledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
}

/** Filled text input — r12 neutral fill, label-inside, 13px helper caption. */
export function FilledInput({
  label,
  helper,
  error,
  id,
  name,
  className = "",
  ...props
}: FilledInputProps) {
  const inputId = id ?? name;
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      inputId={inputId}
      className={className}
    >
      <input id={inputId} name={name} className={VALUE} {...props} />
    </FieldShell>
  );
}

interface FilledSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

/** Filled select — same shell as FilledInput; pass `<option>`s as children. */
export function FilledSelect({
  label,
  helper,
  error,
  id,
  name,
  className = "",
  children,
  ...props
}: FilledSelectProps) {
  const inputId = id ?? name;
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      inputId={inputId}
      className={className}
    >
      <select id={inputId} name={name} className={VALUE} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
