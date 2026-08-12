import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

export function FinalScene() {
  const isMobile = useIsMobile()
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  return (
    <section
      id="final"
      style={{
        position: 'relative',
        padding: isMobile ? '100px 24px' : '120px 80px',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/lifestyle/room-living.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,24,16,0.75)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          maxWidth: 700,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: 0,
          }}
        >
          Ready to Start?
        </p>

        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 38 : 56,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.1,
            margin: 0,
            marginTop: 20,
          }}
        >
          Your room is waiting.
        </h2>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(245,242,237,0.6)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 20,
            maxWidth: 460,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Design your blind online. See it in your room. We measure, manufacture, and install.
        </p>

        <div
          style={{
            display: 'flex',
            // center, not the default stretch — stretch made the secondary the
            // same height as Buy Now and flattened the hierarchy the larger
            // primary exists to create.
            alignItems: 'center',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 36,
          }}
        >
          {/* Buy Now is primary and larger, matching the hero. Same pair, same
              hierarchy, both ends of the page. */}
          <Link
            to="/products"
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            style={{
              padding: '20px 66px',
              borderRadius: 6,
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              background: primaryHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              boxShadow: primaryHover
                ? '0 14px 30px rgba(28,24,16,0.40)'
                : '0 8px 20px rgba(28,24,16,0.28)',
            }}
          >
            Buy Now
          </Link>
          <Link
            to="/visualiser"
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
            style={{
              padding: '16px 40px',
              borderRadius: 6,
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              background: 'transparent',
              color: secondaryHover ? tokens.gold : tokens.warmWhite,
              border: `1px solid ${secondaryHover ? tokens.gold : 'rgba(245,242,237,0.3)'}`,
            }}
          >
            Design Yours
          </Link>
        </div>

        {/* Trust badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? 20 : 36,
            marginTop: 40,
            flexWrap: 'wrap',
          }}
        >
          {['Australian Made', '5 Year Warranty', 'Free Installation'].map((badge) => (
            <div
              key={badge}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: tokens.gold,
                }}
              />
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(245,242,237,0.5)',
                }}
              >
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
