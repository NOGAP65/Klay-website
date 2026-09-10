import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';
import { scrollToId } from '@/shared';
import { JourneyStepDetail } from './JourneyStepDetail';

const PROCESS_STEPS = [
  { title: 'Buy online' },
  { title: 'Check measure' },
  { title: 'Installation' },
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
        <div className="home-process-heading">
          <h2 id="home-process-title">One price. <em>Perfectly fitted.</em></h2>
          <button className="home-process-next" type="button" onClick={scrollToId('visualiser')}>
            Visualise your space <span aria-hidden="true">↗</span>
          </button>
        </div>
        <ol className="home-process-list">
          {PROCESS_STEPS.map((step, index) => (
            <li className="home-process-item" key={step.title}>
              <span className="home-process-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{index === 0 ? <Link to={routes.products}>{step.title}</Link> : step.title}</h3>
                <JourneyStepDetail index={index} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
