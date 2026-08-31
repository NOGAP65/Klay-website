// ---------------------------------------------------------------------------
// Honeypot field — an invisible input that bots fill in but humans don't.
//
// Rendered with aria-hidden and tabindex="-1" so screen readers and keyboard
// users skip it. CSS hides it visually. If a value is present when the form
// submits, the server silently drops the request and returns a fake success.
// ---------------------------------------------------------------------------

interface HoneypotProps {
  value: string;
  onChange: (value: string) => void;
}

export function Honeypot({ value, onChange }: HoneypotProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: 1,
        height: 1,
        overflow: 'hidden',
      }}
    >
      <label>
        Website
        <input
          type="text"
          name="website"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
