"use client";
import { useId, useState } from "react";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  full?: boolean;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  style?: React.CSSProperties;
}

export function Input({
  label,
  type = "text",
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  disabled,
  autoFocus,
  full = true,
  name,
  required,
  autoComplete,
  maxLength,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;
  const borderColor = error
    ? "var(--wrong)"
    : focused
    ? "var(--accent)"
    : "var(--hairline-2)";

  return (
    <div style={{ width: full ? "100%" : undefined }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontSize: "var(--text-label)",
            fontWeight: 600,
            letterSpacing: "var(--tracking-label)",
            textTransform: "uppercase",
            color: "var(--fg-3)",
            marginBottom: 8,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        name={name}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 50,
          boxSizing: "border-box",
          padding: "0 16px",
          borderRadius: "var(--radius-md)",
          border: `1.5px solid ${borderColor}`,
          background: "var(--surface)",
          color: "var(--fg-1)",
          fontSize: "var(--text-body)",
          fontWeight: 400,
          fontFamily: "var(--font-sans)",
          letterSpacing: "var(--tracking-snug)",
          outline: "none",
          // Visible focus ring (the UA outline is suppressed above); the tint
          // ring + accent border give a clear, themed focus indicator.
          boxShadow: focused
            ? `0 0 0 3px ${error ? "var(--wrong-tint)" : "var(--accent-tint)"}`
            : "none",
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "text",
          transition: "border-color .16s, box-shadow .16s",
          ...style,
        }}
      />
      {error && (
        <p id={errorId} role="alert" style={{ fontSize: "var(--text-small)", color: "var(--wrong)", margin: "8px 0 0", lineHeight: 1.45 }}>
          {error}
        </p>
      )}
    </div>
  );
}
