import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';
import { JourneyStepDetail } from './JourneyStepDetail';

const BAR_STEPS = [
  { label: 'Buy now', to: routes.products },
  { label: 'Professional check measure', to: routes.howItWorks },
  { label: 'Professional installation', to: routes.howItWorks },
];

export function StepsBar() {
  return (
    <section className="home-steps" aria-label="How buying with Klay works">
      <p className="home-steps-intro">One platform. Turnkey solutions for every product.</p>
      <ol className="home-steps-list">
        {BAR_STEPS.map((step, index) => (
          <li className="home-steps-item" key={step.label}>
            <Link className="home-steps-link" to={step.to}>
              <span className="home-steps-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="home-steps-copy">
                <h2>{step.label}</h2>
                <JourneyStepDetail index={index} />
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
