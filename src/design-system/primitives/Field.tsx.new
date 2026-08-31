import { useState, useId } from 'react';
import { tokens, motion } from '@/ds';

// ---------------------------------------------------------------------------
// A controlled form input in the site's own idiom.
//
// ContactPage had its own local Field, but it took no value/onChange — which is
// exactly why that form could never submit anything. This is the version that
// holds state, shows validation errors, and is shared by the contact form and
// the booking form so the two behave identically.
//
// Accessibility: outline:'none' strips the browser's focus ring, so a gold
// border replaces it — a keyboard user must still be able to see where they
// are. Errors are tied to the input with aria-describedby and announced via
// role="alert", rather than being colour-only.
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: tokens.body,
  fontSize: 11,
  color: tokens.inkSoft,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
};

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  autoComplete?: string;
  /** Server- or client-side message for this field. Presence turns the border red. */
  error?: string;
  /** Native constraint, e.g. a date that must not be in the past. */
  min?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'email';
  maxLength?: number;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  textarea,
  rows = 4,
  placeholder,
  autoComplete,
  error,
  min,
  inputMode,
  maxLength,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  // Error outranks focus — a red border that turns bronze when you click into it
  // would hide the problem at the exact moment you are trying to fix it.
  //
  // `accentEdge`, not `accent`: the bronze itself measures 3.45 against paper,
  // which clears 1.4.11's 3:1 for a border but only barely, and a focus ring is
  // the one border on the site that has to be unmistakable. The deeper sibling
  // measures 6.24.
  const borderColour = error ? DANGER : focused ? tokens.accentEdge : tokens.line;

  const style: React.CSSProperties = {
    width: '100%',
    padding: '15px 16px',
    // THE PALE SHADE, and this is the one place it earns its keep: the focused
    // field tints as well as taking a bronze edge, so which box has the caret is
    // legible from across the form rather than from a 1px line. Ink on
    // accentWash measures 14.73, so the value being typed loses nothing.
    //
    // Not applied on error: a bronze-tinted field with a red border is two states
    // arguing, and the error is the one that matters.
    background: focused && !error ? tokens.accentWash : tokens.card,
    border: `1px solid ${borderColour}`,
    fontFamily: tokens.body,
    fontSize: 14,
    color: tokens.ink,
    outline: 'none',
    boxSizing: 'border-box',
    transition: motion.link,
  };

  const shared = {
    id,
    value,
    required,
    placeholder,
    autoComplete,
    maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  } as const;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle} htmlFor={id}>
        {label}
        {required && <span style={{ color: tokens.onDark, marginLeft: 4 }}>*</span>}
      </label>

      {textarea ? (
        <textarea
          {...shared}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : (
        <input
          {...shared}
          type={type}
          min={min}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          style={style}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ fontFamily: tokens.body, fontSize: 12, color: DANGER, margin: '6px 0 0' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** The one red on the site. Deliberately desaturated so it reads as a warning
 *  inside a warm palette rather than a browser-default error. */
export const DANGER = '#A03A28';
