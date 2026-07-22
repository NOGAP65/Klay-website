import { useRef, useState } from 'react';
import { tokens } from '../theme';

interface Job {
  location: string;
  product: string;
  detail: string;
  photo: string;
}

const jobs: Job[] = [
  { location: 'SOUTH YARRA, VIC', product: 'Dusk White — Blockout Roller', detail: '3 windows · White hardware · Manual', photo: '/images/room-3.png' },
  { location: 'HAWTHORN, VIC', product: 'Duo Chrome — Dual Roller', detail: '5 windows · Chrome hardware · Motorised', photo: '/images/room-4.png' },
  { location: 'BRIGHTON, VIC', product: 'Veil White — Sunscreen Roller', detail: '4 windows · White hardware · Manual', photo: '/images/room-5.png' },
  { location: 'KEW, VIC', product: 'Dusk Noir — Blockout Roller', detail: '2 windows · Black hardware · Motorised', photo: '/images/curtains-room.jpg' },
];

export function JobsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current.dragging = true;
    dragState.current.startX = e.pageX - el.offsetLeft;
    dragState.current.scrollLeft = el.scrollLeft;
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !dragState.current.dragging) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const stopDragging = () => {
    dragState.current.dragging = false;
    setIsDragging(false);
  };

  return (
    <section style={{ background: '#0f0d09', padding: '100px 80px' }}>
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 11,
          color: tokens.gold,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          marginBottom: 16,
        }}
      >
        Recent Installs
      </div>
      <h2
        style={{
          fontFamily: tokens.display,
          fontSize: 'clamp(42px, 5vw, 68px)',
          fontWeight: 300,
          color: '#F8F6F2',
          lineHeight: 0.92,
          margin: 0,
        }}
      >
        Jobs we're proud of.
      </h2>

      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        style={{
          display: 'flex',
          gap: '3px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          marginTop: 48,
        }}
      >
        {jobs.map((job, index) => (
          <div
            key={job.location}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex((i) => (i === index ? null : i))}
            style={{
              minWidth: '400px',
              flexShrink: 0,
              height: '500px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <img
              src={job.photo}
              alt={job.product}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease',
                transform: hoveredIndex === index ? 'scale(1.04)' : 'scale(1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '55%',
                background: 'linear-gradient(0deg,rgba(10,8,5,0.95) 0%,transparent 100%)',
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px' }}>
              <div
                style={{
                  fontFamily: tokens.body,
                  fontSize: 10,
                  color: tokens.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginBottom: 8,
                }}
              >
                {job.location}
              </div>
              <div style={{ fontFamily: tokens.display, fontSize: 26, color: '#F8F6F2', lineHeight: 1 }}>
                {job.product}
              </div>
              <div
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(248,246,242,0.45)',
                  marginTop: 6,
                }}
              >
                {job.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <span style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(248,246,242,0.2)', fontStyle: 'italic' }}>
          More installs added as we grow across Victoria.
        </span>
      </div>
    </section>
  );
}
