// import/no-cycle — the SIMPLE shape: two files importing each other directly.
import { beta } from './beta';
export const alpha = () => beta();
