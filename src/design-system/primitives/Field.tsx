// ---------------------------------------------------------------------------
// Field — §3 requires design-system/primitives/Field.tsx, and this is it.
//
// IT IS A RE-EXPORT, NOT A NEW COMPONENT, AND THAT IS THE WHOLE POINT.
//
// src/components/FormField.tsx already is this primitive: a controlled input
// with a label, an error message wired through aria-describedby, a focus tint
// and a shared danger colour. It is used by the booking form and the contact
// form and it works.
//
// Writing a second form input here to satisfy a checklist item would be The
// Second Implementation — SPECIFICATION.md §13, the named anti-pattern this
// entire architecture exists to prevent, and the one this codebase has already
// committed twice. Two form inputs, both good, neither knowing about the other,
// is exactly how /cart and /book happened.
//
// So the primitive exists at the path the specification asks for, and there is
// exactly one implementation behind it.
//
// PHASE 3 COLLAPSES THIS. FormField's body moves here, `src/components/
// FormField.tsx` becomes the shim instead, and its consumers are repointed at
// @/ds. That is a move, and moves belong to Phase 3 — doing it here would have
// mixed a move into a create.
//
// One thing to resolve when that happens: FormField exports DANGER
// ('#A03A28'), the one red on the site. It is a colour and it belongs in
// tokens/colour.ts, not beside a component.
// ---------------------------------------------------------------------------

export { FormField as Field, DANGER } from '../../components/FormField';
export type { FormFieldProps as FieldProps } from '../../components/FormField';
