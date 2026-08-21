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
        gap: isMobile ? 48 : 100,
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
          borderRadius: 20,
          aspectRatio: isMobile ? '4 / 3' : '4 / 3',
          boxShadow: imageHover
            ? '0 40px 80px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.5s ease',
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
            transform: imageHover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '0' : '40px 0',
        }}
      >
        {/* Large number */}
        <span
          style={{
            fontFamily: tokens.display,
            fontSize: 80,
            fontWeight: 200,
            color: tokens.onDark,
            opacity: 0.3,
            lineHeight: 0.9,
            display: 'block',
          }}
        >
          0{index + 1}
        </span>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            fontWeight: 500,
            color: tokens.onDark,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            margin: 0,
            marginTop: 20,
          }}
        >
          {feature.subtitle}
        </p>

        {/* Title */}
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 34 : 42,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.15,
            margin: 0,
            marginTop: 16,
          }}
        >
          {feature.title}
        </h3>

        {/* Body */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(245,242,237,0.6)',
            lineHeight: 1.8,
            margin: 0,
            marginTop: 24,
            maxWidth: 480,
          }}
        >
          {feature.body}
        </p>

        {/* Decorative line */}
        <div
          style={{
            width: 80,
            height: 2,
            background: `linear-gradient(90deg, ${tokens.fillStrong} 0%, transparent 100%)`,
            marginTop: 40,
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
        background: tokens.charcoal,
        padding: isMobile ? '100px 24px' : '160px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 80 : 120 }}>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              color: tokens.onDark,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              margin: 0,
            }}
          >
            The Klay Difference
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 38 : 56,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.1,
              margin: 0,
              marginTop: 24,
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
            gap: isMobile ? 100 : 140,
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
