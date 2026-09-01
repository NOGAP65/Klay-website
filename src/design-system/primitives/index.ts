// The primitives barrel. Re-exports only — SPECIFICATION.md §4.
export { Field, DANGER, type FieldProps } from './Field';

// Split out of components/home/primitives.tsx at P4-6, decision F — design
// primitives with no product knowledge, which is what made them movable.
export { useHover } from './useHover';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';
export { ctaBase, ctaFill, type CtaVariant } from './cta';
export { CtaLink } from './CtaLink';
export { CtaButton } from './CtaButton';
export { TextLink } from './TextLink';
