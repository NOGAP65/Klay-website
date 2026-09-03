// ---------------------------------------------------------------------------
// THE WALL COLOUR, ON THE PICTURE RATHER THAN IN THE FORM.
//
// It began as a field in the configuration panel and that was the wrong place
// for it twice over. It is not a configuration — nothing about it reaches a
// quote, and it sat in a list of things that decide what gets built saying
// something that does not. And it is judged by eye against the render, so
// putting it a column away meant looking left to click and right to see.
//
// So it lives on the preview, over the top edge of the picture it changes: a
// chip the size of a caption, and everything else behind an arrow. Shut, it is
// a swatch and a word. Open, it grows DOWNWARD into the picture — over the wall
// it is painting, which is the surface you are trying to match.
//
// WHY IT OPENS DOWN AND NOT UP. There is nothing above it but the frame, and a
// panel that grows up would push against the edge and then flip. Down, it opens
// into the largest empty area of the render — the wall above the wardrobe —
// which is both the room to do it in and the thing being judged.
//
// It floats rather than sitting in the flow so opening it cannot resize the
// media box. A render that jumps when you open a colour picker is a render you
// cannot compare against.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { WALL_COLOURS, wallColourName, publishWallColour } from './wallColours';

export interface WallColourChipProps {
  value: string;
  onChange: (hex: string) => void;
}

/** Paper on ink, at low weight. The chip sits over a photograph or a render, so
 * it carries its own ground — the site's rule against type on pictures is about
 * unbacked type, and this is a backed lozenge. Dark rather than light because
 * the render behind it is nearly always pale. */
const INK = 'rgba(29,29,29,0.86)';
const PAPER = '#F8F8F8';

export default function WallColourChip({ value, onChange }: WallColourChipProps) {
  const [open, setOpen] = useState(false);

  // THE DRAG IS LOCAL. What the wheel emits goes to the scene directly and to
  // this component's own state, and only settles into the shared store once the
  // pointer stops — see the note on publishWallColour. Sent through the store
  // on every move it cost 97ms a colour at 4x throttle, all of it React
  // re-rendering the panel; this way the loop is a material assignment.
  //
  // The local value also has to follow the prop, or clicking a swatch would
  // leave the chip's own label showing the last dragged colour.
  const [live, setLive] = useState(value);
  useEffect(() => { setLive(value); }, [value]);

  const settle = useRef<number | undefined>(undefined);
  const drag = (hex: string) => {
    setLive(hex);
    publishWallColour(hex);
    window.clearTimeout(settle.current);
    // Long enough that a continuous drag never writes, short enough that
    // letting go feels like it committed immediately.
    settle.current = window.setTimeout(() => onChange(hex), 180);
  };
  // A drag interrupted by unmount would otherwise write to a dead store.
  useEffect(() => () => window.clearTimeout(settle.current), []);

  // A swatch is one event, not a stream — it commits on the spot.
  const pick = (hex: string) => {
    window.clearTimeout(settle.current);
    setLive(hex);
    onChange(hex);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        // Never wider than the picture on a phone, and never so wide on a
        // desktop that it stops reading as a chip.
        width: 'min(232px, calc(100% - 24px))',
        borderRadius: 6,
        background: INK,
        color: PAPER,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(29,29,29,0.18)',
        fontFamily: 'inherit',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Wall colour"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 30,
          padding: '0 10px',
          border: 'none',
          background: 'none',
          color: 'inherit',
          font: 'inherit',
          fontSize: 11,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 12, height: 12, flex: '0 0 auto',
            borderRadius: 2,
            background: live,
            // A pale swatch on a dark chip needs no ring; a dark one would
            // vanish without it.
            border: '1px solid rgba(248,248,248,0.35)',
          }}
        />
        <span style={{ opacity: 0.72 }}>Wall</span>
        <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{wallColourName(live)}</span>
        <span
          aria-hidden="true"
          style={{
            width: 0, height: 0, flex: '0 0 auto',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `5px solid ${PAPER}`,
            opacity: 0.7,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      {open && (
        <div style={{ padding: '2px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* A GRID RATHER THAN A ROW. Eight swatches in a line would make the
              chip as wide as the picture; four by two keeps it the width of the
              chip it grew out of. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {WALL_COLOURS.map(c => {
              const active = live.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => pick(c.hex)}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={active}
                  style={{
                    height: 26,
                    borderRadius: 3,
                    background: c.hex,
                    cursor: 'pointer',
                    // The selected one wears a paper ring held off the colour by
                    // the chip's own ground, so the ring never eats into the
                    // colour being judged.
                    border: active ? `1px solid ${PAPER}` : '1px solid rgba(248,248,248,0.2)',
                    outline: active ? `1px solid ${INK}` : 'none',
                    outlineOffset: -2,
                  }}
                />
              );
            })}
          </div>

          {/* THE WHEEL. Native, which is the platform's own picker: better on a
              phone than anything drawn here, keyboard and screen-reader correct
              for free, and it costs no bundle. Live on input, so dragging round
              it repaints the room under the pointer — which is only possible
              because a colour change repaints rather than rebuilds the scene.
              See WardrobeScene.setWallColour. */}
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11, opacity: 0.72, cursor: 'pointer',
            }}
          >
            <input
              type="color"
              value={live}
              onChange={e => drag(e.target.value)}
              style={{
                width: 24, height: 24, padding: 0,
                border: '1px solid rgba(248,248,248,0.35)',
                borderRadius: 3,
                background: 'none',
                cursor: 'pointer',
                flex: '0 0 auto',
              }}
            />
            Match your own
          </label>
        </div>
      )}
    </div>
  );
}
