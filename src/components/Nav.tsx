import { useKlayStore } from '../store';
import { tokens } from '../theme';

const links = [
  { label: 'Collection', href: '#collection' },
  { label: 'Process', href: '#process' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#final' },
];

export function Nav() {
  const scrollY = useKlayStore((s) => s.scrollY);
  const compressed = scrollY > 60;

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compressed ? '14px 5vw' : '26px 5vw',
        background: compressed ? 'rgba(20,20,20,0.72)' : 'transparent',
        backdropFilter: compressed ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: compressed ? 'blur(14px)' : 'none',
        borderBottom: compressed ? '1px solid rgba(200,151,58,0.16)' : '1px solid transparent',
        transition: 'padding 0.5s ease, background 0.5s ease, border-color 0.5s ease',
      }}
    >
      <a
        href="#top"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: tokens.warmWhite,
        }}
      >
        <img
          src="/images/klay%202.jpeg"
          alt="Klay Interiors"
          style={{ width: '150px', height: '64px', objectFit: 'cover', objectPosition: 'center' }}
        />
      </a>

      <div
        style={{
          display: 'flex',
          gap: 38,
          alignItems: 'center',
        }}
      >
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              color: tokens.warmWhite,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.82,
            }}
          >
            {l.label}
          </a>
        ))}
      </div>

      <a
        href="#visualiser"
        style={{
          border: `1px solid ${tokens.gold}`,
          color: tokens.gold,
          textDecoration: 'none',
          fontFamily: tokens.body,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '12px 22px',
          transition: 'background 0.3s ease, color 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = tokens.gold;
          e.currentTarget.style.color = tokens.dark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = tokens.gold;
        }}
      >
        Design Yours
      </a>
    </nav>
  );
}
