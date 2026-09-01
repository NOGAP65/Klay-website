// import/no-internal-modules — §1 rule 3, the barrel is the only entrance
import { useCartStore } from '@/features/cart/store/cartStore';
export const x = useCartStore;
