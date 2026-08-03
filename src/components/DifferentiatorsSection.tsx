import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const FEATURES = [
  {
    title: 'See It Before You Buy',
    subtitle: "Australia's only blind visualiser",
    body: 'Upload a photo of your window and watch your blind render in real time. Try every fabric, every colour, every style — before you spend a cent.',
    image: '/images/lifestyle/step-1-configure.png',
    reverse: false,
  },
  {
    title: 'We Come to You',
    subtitle: 'Professional measurement & installation',
    body: 'No DIY, no guesswork. A Klay technician measures your windows to the millimetre, then returns to install your blinds perfectly. All included.',
    image: '/images/lifestyle/step-2-measure.png',
    reverse: true,
  },
  {
    title: 'One Person, Start to Finish',
    subtitle: 'Your dedicated technician',
    body: 'The same person who measures your windows installs your blinds. They know your home, your windows, and exactly how everything needs to fit.',
    image: '/images/lifestyle/step-4-install.png',
    reverse: false,
  },
]

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  const isMobile = useIsMobile()
  const [imageHover, setImageHover] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile
          ? 'column'
          : feature.reverse
            ? 'row-reverse'
            : 'row',
        alignItems: 'center',
        gap: isMobile ? 40 : 80,
      }}
    >
      {/* Image */}
      <div
        onMouseEnter={() => setImageHover(true)}
        onMouseLeave={() => setImageHover(false)}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          aspectRatio: isMobile ? '4 / 3' : '3 / 2',
          boxShadow: imageHover
            ? '0 32px 64px rgba(28,24,16,0.25)'
            : '0 16px 48px rgba(28,24,16,0.15)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        <img
          src={feature.image}
          alt={feature.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: imageHover ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, transparent 60%, rgba(28,24,16,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '0' : '20px 0',
        }}
      >
        {/* Number */}
        <span
          style={{
            fontFamily: tokens.display,
            fontSize: 64,
            fontWeight: 200,
            color: tokens.gold,
            opacity: 0.3,
            lineHeight: 1,
            display: 'block',
          }}
        >
          0{index + 1}
        </span>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: 0,
            marginTop: 16,
          }}
        >
          {feature.subtitle}
        </p>

        {/* Title */}
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 36 : 44,
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 1.1,
            margin: 0,
            marginTop: 12,
          }}
        >
          {feature.title}
        </h3>

        {/* Body */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(28,24,16,0.6)',
            lineHeight: 1.8,
            margin: 0,
            marginTop: 20,
            maxWidth: 440,
          }}
        >
          {feature.body}
        </p>

        {/* Decorative line */}
        <div
          style={{
            width: 60,
            height: 2,
            background: tokens.gold,
            marginTop: 32,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  )
}

export function DifferentiatorsSection() {
  const isMobile = useIsMobile()

  return (
    <section
      style={{
        background: tokens.warmWhite,
        padding: isMobile ? '80px 24px' : '140px 80px',
      }}
    >
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 60 : 100 }}>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              margin: 0,
            }}
          >
            The Klay Difference
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 40 : 60,
              fontWeight: 300,
              color: tokens.ink,
              lineHeight: 1.05,
              margin: 0,
              marginTop: 20,
            }}
          >
            Not just blinds. A better way.
          </h2>
        </div>

        {/* Feature blocks */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 80 : 120,
          }}
        >
          {FEATURES.map((feature, index) => (
            <FeatureBlock key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
