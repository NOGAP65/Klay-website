import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';

const BAR_STEPS = [
  { label: 'Buy online', body: 'Choose your product', to: routes.products },
  { label: 'Check measure', body: 'Every detail confirmed', to: routes.howItWorks },
  { label: 'Installation', body: 'Professionally fitted', to: routes.howItWorks },
];

export function StepsBar() {
  return (
    <section className="home-steps" aria-label="How buying with Klay works">
      <ol className="home-steps-list">
        {BAR_STEPS.map((step, index) => (
          <li className="home-steps-item" key={step.label}>
            <Link className="home-steps-link" to={step.to}>
              <span className="home-steps-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="home-steps-copy">
                <h2>{step.label}</h2>
                <p>{step.body}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
