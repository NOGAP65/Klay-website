/** Fixed card shapes with a light CSS sweep, without expensive photo snapshots. */
export function ShopResultsSkeleton({ count }: { count: number }) {
  return <div className="shop-skeleton-overlay" aria-hidden="true">
    <div className="shop-skeleton-grid">
      {Array.from({ length: Math.max(1, Math.min(count, 2)) }, (_, index) => <div className="shop-skeleton-card" key={index}>
        <div className="shop-skeleton-line shop-skeleton-heading" />
        <div className="shop-skeleton-line" />
        <div className="shop-skeleton-body">
          <div className="shop-skeleton-photo" />
          <div className="shop-skeleton-fields">
            {[0, 1, 2, 3].map(field => <div key={field} className="shop-skeleton-field" />)}
            <div className="shop-skeleton-action" />
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}
