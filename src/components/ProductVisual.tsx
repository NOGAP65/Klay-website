import { tokens } from '../theme';

export type ProductType =
  | 'blockout'
  | 'sunscreen'
  | 'dual'
  | 'sheer'
  | 'shutter'
  | 'outdoor';

const daylight =
  'radial-gradient(120% 90% at 50% 0%, #f3ecdd 0%, #d8cdb6 45%, #8f846d 100%)';

function Cassette() {
  return (
    <div
      style={{
        height: 16,
        background: `linear-gradient(180deg, ${tokens.goldLight}, ${tokens.gold})`,
        boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
        position: 'relative',
        zIndex: 2,
      }}
    />
  );
}

function Rail({ dark }: { dark?: boolean }) {
  return (
    <div
      style={{
        height: 10,
        background: dark
          ? 'linear-gradient(180deg, #3a3a3a, #1f1f1f)'
          : `linear-gradient(180deg, ${tokens.gold}, ${tokens.goldLight})`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}
    />
  );
}

function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 420,
        background: daylight,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

export function ProductVisual({ type }: { type: ProductType }) {
  if (type === 'blockout') {
    return (
      <Scene>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <Cassette />
          <div
            style={{
              flex: 1,
              background: `repeating-linear-gradient(180deg, #2a2318 0px, #2a2318 5px, #342b1c 5px, #342b1c 10px)`,
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
            }}
          />
          <Rail />
        </div>
      </Scene>
    );
  }

  if (type === 'sunscreen') {
    return (
      <Scene>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <Cassette />
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(90,78,54,0.55)',
              backgroundImage: `repeating-linear-gradient(0deg, rgba(20,16,8,0.5) 0px, rgba(20,16,8,0.5) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(20,16,8,0.5) 0px, rgba(20,16,8,0.5) 1px, transparent 1px, transparent 4px)`,
            }}
          />
          <Rail />
        </div>
      </Scene>
    );
  }

  if (type === 'dual') {
    return (
      <Scene>
        {/* back blockout, fully down */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              background: `repeating-linear-gradient(180deg, #2a2318 0px, #2a2318 5px, #342b1c 5px, #342b1c 10px)`,
              opacity: 0.9,
            }}
          />
        </div>
        {/* front sunscreen, partially down */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '58%', display: 'flex', flexDirection: 'column' }}>
          <Cassette />
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(120,104,72,0.5)',
              backgroundImage: `repeating-linear-gradient(0deg, rgba(20,16,8,0.4) 0px, rgba(20,16,8,0.4) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(20,16,8,0.4) 0px, rgba(20,16,8,0.4) 1px, transparent 1px, transparent 4px)`,
            }}
          />
          <Rail />
        </div>
      </Scene>
    );
  }

  if (type === 'sheer') {
    return (
      <Scene>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(90deg, rgba(233,224,205,0.85) 0px, rgba(233,224,205,0.85) 6px, rgba(190,178,150,0.7) 14px, rgba(233,224,205,0.85) 22px)`,
            boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: `linear-gradient(180deg, #4a3f28, #6b5c3a)`,
          }}
        />
      </Scene>
    );
  }

  if (type === 'shutter') {
    return (
      <Scene>
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: `10px solid #efe7d6`,
            background: '#cbbfa4',
            display: 'flex',
          }}
        >
          {[0, 1].map((panel) => (
            <div
              key={panel}
              style={{
                flex: 1,
                borderRight: panel === 0 ? '5px solid #efe7d6' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '6px 0',
                background: '#e6dcc7',
              }}
            >
              {Array.from({ length: 11 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 14,
                    margin: '0 6px',
                    borderRadius: 3,
                    background: 'linear-gradient(180deg, #fbf6ec 0%, #d9cdb2 55%, #b8a988 100%)',
                    boxShadow: '0 3px 4px rgba(0,0,0,0.18)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </Scene>
    );
  }

  // outdoor
  return (
    <Scene>
      {/* side guide channels */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, background: 'linear-gradient(90deg, #2b2b2b, #454545)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 14, background: 'linear-gradient(270deg, #2b2b2b, #454545)' }} />
      <div style={{ position: 'absolute', inset: '0 14px 0 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 18, background: 'linear-gradient(180deg, #4a4a4a, #2b2b2b)' }} />
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(58,50,34,0.85)',
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 6px)`,
          }}
        />
        <div style={{ height: 16, background: 'linear-gradient(180deg, #565656, #2b2b2b)', boxShadow: '0 4px 10px rgba(0,0,0,0.6)' }} />
      </div>
    </Scene>
  );
}
