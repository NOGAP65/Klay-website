import { useState } from 'react';
import { tokens, eyebrow, headline, layout, motion, shadow, supporting } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

// ---------------------------------------------------------------------------
// PLACEHOLDER LINKS — confirm every handle before this goes live. They follow
// the klayinteriors.com.au domain, but an unverified social URL sends
// customers to whoever actually owns that handle. Correct them here; this is
// the only place they are written down.
// ---------------------------------------------------------------------------
const HANDLE = '@klayinteriors';

interface Social {
  name: string;
  url: string;
  /** 24x24 viewBox path data. Inline so nothing is fetched at runtime. */
  path: string;
  filled: boolean;
}

const SOCIALS: Social[] = [
  {
    name: 'Instagram',
    url: 'https://instagram.com/klayinteriors',
    filled: false,
    path: 'M7 2.75h10A4.25 4.25 0 0 1 21.25 7v10A4.25 4.25 0 0 1 17 21.25H7A4.25 4.25 0 0 1 2.75 17V7A4.25 4.25 0 0 1 7 2.75Zm5 5.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm5.4-1.15h.01',
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/klayinteriors',
    filled: true,
    path: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.4-.12-2.4 0-4 1.45-4 4.1v2.32H7.6V13h2.7v8h3.2Z',
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@klayinteriors',
    filled: true,
    path: 'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.82-2.47V9.7a5.66 5.66 0 1 0 4.91 5.6V8.99a7.34 7.34 0 0 0 4.28 1.37V7.27a4.28 4.28 0 0 1-3.22-1.45Z',
  },
  {
    name: 'Pinterest',
    url: 'https://pinterest.com/klayinteriors',
    filled: true,
    path: 'M12 2a10 10 0 0 0-3.65 19.31c-.09-.78-.17-1.98.03-2.83.19-.77 1.2-5.1 1.2-5.1s-.31-.61-.31-1.52c0-1.42.83-2.48 1.85-2.48.87 0 1.3.66 1.3 1.44 0 .88-.56 2.2-.85 3.42-.24 1.02.51 1.86 1.52 1.86 1.83 0 3.23-1.93 3.23-4.71 0-2.46-1.77-4.18-4.3-4.18-2.93 0-4.65 2.2-4.65 4.47 0 .89.34 1.84.77 2.36a.3.3 0 0 1 .07.3c-.08.32-.25 1.02-.29 1.16-.05.19-.15.23-.35.14-1.3-.61-2.11-2.5-2.11-4.03 0-3.28 2.38-6.29 6.87-6.29 3.6 0 6.4 2.57 6.4 6 0 3.58-2.26 6.46-5.39 6.46-1.05 0-2.04-.55-2.38-1.2 0 0-.52 2.01-.65 2.5-.23.9-.86 2.03-1.29 2.72A10 10 0 1 0 12 2Z',
  },
];

interface Post {
  photo: string;
  caption: string;
  place: string;
}

// Real installs, doubling as the feed. Same photos the old Jobs rail used.
const POSTS: Post[] = [
  { photo: '/images/room-3.png', caption: 'Dusk White, three windows', place: 'South Yarra' },
  { photo: '/images/room-4.png', caption: 'Duo Chrome, motorised', place: 'Hawthorn' },
  { photo: '/images/room-5.png', caption: 'Veil White, north-facing', place: 'Brighton' },
  { photo: '/images/curtains-room.jpg', caption: 'Dusk Noir, black hardware', place: 'Kew' },
];

function SocialIcon({ social }: { social: Social }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.name}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 42,
        height: 42,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        // Light-ground values now the section is parchment — onDarkLine and
        // onDark are warmWhite-derived and were invisible against it.
        border: `1px solid ${hover ? tokens.gold : tokens.line}`,
        background: hover ? 'rgba(200,151,58,0.12)' : 'transparent',
        color: hover ? tokens.gold : tokens.ink,
        transition: `${motion.link}, background 0.2s ease, transform 0.25s ease`,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill={social.filled ? 'currentColor' : 'none'}
        stroke={social.filled ? 'none' : 'currentColor'}
        strokeWidth={social.filled ? 0 : 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={social.path} />
      </svg>
    </a>
  );
}

function PostTile({ post }: { post: Post }) {
  const [hover, setHover] = useState(false);
  return (
    <figure
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        margin: 0,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        borderRadius: 2,
        cursor: 'pointer',
        // Ink-mixed rather than pure black: on parchment a black shadow greys
        // the ground around the tile instead of warming it.
        boxShadow: hover ? shadow.lift : shadow.rest,
        transform: hover ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: motion.card,
      }}
    >
      <img
        src={post.photo}
        alt={post.caption}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.7s ease',
          transform: hover ? 'scale(1.06)' : 'scale(1)',
        }}
      />
      <figcaption
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 18,
          background: `linear-gradient(0deg, rgba(28,24,16,${hover ? 0.9 : 0.75}) 0%, rgba(28,24,16,0) 62%)`,
          transition: 'background 0.35s ease',
        }}
      >
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: tokens.gold,
            marginBottom: 6,
          }}
        >
          {post.place}
        </span>
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 12.5,
            lineHeight: 1.4,
            color: tokens.onDark,
          }}
        >
          {post.caption}
        </span>
      </figcaption>
    </figure>
  );
}

export function SocialSection() {
  const isMobile = useIsMobile();

  return (
    // Parchment. Social proof is a warm, human moment — the trust tone, not a
    // conviction one. As charcoal this sat as a second dark slab in the middle
    // of the page and made the installs read as advertising rather than as
    // other people's homes. It also now separates the visualiser above it from
    // the collection below without either needing a dark band between them.
    <section
      style={{
        background: tokens.parchment,
        padding: layout.sectionPad(isMobile),
      }}
    >
      <div style={{ maxWidth: layout.gridMax, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            justifyContent: 'space-between',
            gap: isMobile ? 28 : 48,
          }}
        >
          <div>
            <div style={{ ...eyebrow, marginBottom: 18 }}>Follow along</div>
            <h2 style={{ ...headline.section, color: tokens.ink }}>
              Light, in real homes.
            </h2>
            <p style={{ ...supporting.onLight, marginTop: 20, maxWidth: 460 }}>
              Every install we finish across Victoria, as we finish it. Follow{' '}
              <span style={{ color: tokens.gold }}>{HANDLE}</span> for rooms,
              fabrics and the occasional before-and-after.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {SOCIALS.map(s => (
              <SocialIcon key={s.name} social={s} />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 24,
            marginTop: 72,
          }}
        >
          {POSTS.map(p => (
            <PostTile key={p.photo} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
