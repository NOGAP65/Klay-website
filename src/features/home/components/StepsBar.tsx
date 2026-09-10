import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';

const BAR_STEPS = [
  { label: 'Buy now', body: 'Choose your product', to: routes.products },
  { label: 'Professional check measure', body: 'We confirm every detail', to: routes.howItWorks },
  { label: 'Professional installation', body: 'Installed by our professionals', to: routes.howItWorks },
];

export function StepsBar() {
  return (
    <section className="home-steps" aria-label="How buying with Klay works">
      <p className="home-steps-intro">One platform. Turnkey solutions for every product.</p>
      <ol className="home-steps-list">
        {BAR_STEPS.map((step, index) => (
          <li className="home-steps-item" key={step.label}>
            <span className="home-steps-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div className="home-steps-copy">
              <h2><Link to={step.to}>{step.label}</Link></h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
