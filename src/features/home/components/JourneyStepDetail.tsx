/** Shared wording keeps both homepage timelines in step. */
export function JourneyStepDetail({ index }: { index: number }) {
  if (index === 0) {
    return (
      <p className="home-step-pricing">
        <span>Fixed simple pricing</span>
        <span className="home-pricing-sizes" role="img" aria-label="Small, medium and large">
          <span aria-hidden="true" title="Small">S</span>
          <span aria-hidden="true" title="Medium">M</span>
          <span aria-hidden="true" title="Large">L</span>
        </span>
      </p>
    );
  }

  return (
    <p>{index === 1
      ? '3 days to measure and confirm details.'
      : 'Professionally installed within 3 weeks of your measure.'}</p>
  );
}
