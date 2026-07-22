import { CollectionScene } from '../components/CollectionScene';
import { CurtainsScene } from '../components/CurtainsScene';
import { WardrobesScene } from '../components/WardrobesScene';

export default function ProductsPage() {
  return (
    <>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414', color: '#F8F6F2' }}>
        <h1>All Products</h1>
      </main>
      <CollectionScene />
      <CurtainsScene />
      <WardrobesScene />
    </>
  );
}
