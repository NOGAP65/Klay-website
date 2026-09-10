import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';
import { scrollToId } from '@/shared';

const PROCESS_STEPS = [
  { title: 'Buy online', detail: 'Turnkey price, installation included', badge: '',
    image: '', alt: '' },
  { title: 'Check measure', detail: 'Every detail confirmed in your home', badge: 'Measured by our team',
    image: '/images/process/step-2-measure.png', alt: 'A Klay technician measuring a window' },
  { title: 'Professional installation', detail: 'Made to measure. Perfectly fitted.', badge: 'Installation included',
    image: '/images/fabrics/roller-blinds-lightfilter.webp', alt: 'A fitted light-filter roller blind' },
];

export function RecommendationBanner() {
  return (
    <section className="home-process" aria-labelledby="home-process-title">
      <div className="home-process-photo">
        <img src="/images/process/step-1-configure.png" alt="Choosing window coverings online on a laptop"
          loading="lazy" width="1672" height="941" />
      </div>
      <div className="home-process-content">
        <p className="home-banner-eyebrow">From cart to complete</p>
        <h2 id="home-process-title">One price. Perfectly fitted.</h2>
        <div className="home-process-bottom">
          <ol className="home-process-list">
            {PROCESS_STEPS.map((step, index) => (
              <li className="home-process-item" key={step.title}>
                <span className="home-process-dot" aria-hidden="true" />
                {step.image && <img className="home-process-thumb" src={step.image} alt={step.alt}
                  loading="lazy" width="132" height="100" />}
                <span className="home-process-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{index === 0 ? <Link to={routes.products}>{step.title}</Link> : step.title}</h3>
                <p>{step.detail}</p>
                {step.badge && <span className="home-process-badge">{step.badge}</span>}
              </li>
            ))}
          </ol>
          <button className="home-process-next" type="button" onClick={scrollToId('visualiser')}>
            <span>Next</span>
            <strong>Visualise your space <span aria-hidden="true">→</span></strong>
          </button>
        </div>
      </div>
    </section>
  );
}
