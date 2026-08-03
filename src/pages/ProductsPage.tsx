import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect /products to the main blinds category page
// This page is deprecated in favor of the category structure
export default function ProductsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/blinds/roller-blinds', { replace: true });
  }, [navigate]);

  return null;
}
