// ---------------------------------------------------------------------------
// COMPATIBILITY SHIM. The component moved to @/ds in Phase 2.4.
//
// It is a design-system primitive — a controlled input with a label, an error
// tied to it by aria-describedby, and a focus tint — and it now lives where
// SPECIFICATION.md §3 says a Field lives.
//
// Its two consumers (the booking form and the contact form) are repointed at
// @/ds when they migrate to features/ in Phase 4. This file goes with the last
// of them.
// ---------------------------------------------------------------------------

export { Field as FormField, DANGER } from '@/ds';
export type { FieldProps as FormFieldProps } from '@/ds';
