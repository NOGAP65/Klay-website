/**
 * no-banned-abbreviations
 *
 * SPECIFICATION.md §6: "Abbreviations permitted: `id`, `url`, `api`, `ref`,
 * `src`, `px`, `db`, `ui`, `cta`. Everything else spelled out. Not permitted:
 * `cfg`, `btn`, `msg`, `res`, `req`, `tmp`, `val`, `idx` — except `e` in a
 * two-line catch block."
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NARROW, AND WHY THAT IS THE POINT.
 *
 * Phase 0 measured this and reached a conclusion worth honouring: MOST of the
 * codebase's abbreviations are single-letter maths variables inside the two
 * renderers — `x`, `y`, `w`, `h`, `r`, `g`, `b`, `a`, `tl`, `tr`, `bl`, `br`,
 * `uv` — and "renaming them to `xCoordinate` would make the shaders harder to
 * read, not easier."
 *
 * It recommended carving out an explicit exemption for graphics maths. E-08
 * did that by accident and completely: the renderers are out of scope, so this
 * rule never sees them. What is left in scope is a handful of ordinary
 * identifiers, which is exactly the population §6 was written about.
 *
 * So the banned list is CLOSED and short. It is §6's own list, plus the four
 * Phase 0 identified as genuine violations outside the frozen zone: `img`,
 * `len`, `el`, `pct`. Nothing is flagged by pattern or by length — a rule that
 * guessed at "looks like an abbreviation" would flag `spec` in `specRows`
 * (product specifications, a domain noun) and `params` in `new
 * URLSearchParams` (the API's own word), and a rule with false positives gets
 * switched off.
 *
 * SEGMENTS, NOT SUBSTRINGS. `idx` matches `idx` and `rowIdx`, not `index`.
 * Matching substrings would flag `element` for containing `el`, which is the
 * single most likely way to make this rule useless.
 * ---------------------------------------------------------------------------
 */

/** §6's list, plus Phase 0's four genuine ones. Closed on purpose. */
const DEFAULT_BANNED = {
  cfg: 'config',
  btn: 'button',
  msg: 'message',
  res: 'response',
  req: 'request',
  tmp: 'temporary',
  val: 'value',
  idx: 'index',
  img: 'image',
  len: 'length',
  el: 'element',
  pct: 'percent',
  opts: 'options',
};

/** Split an identifier into lower-cased camelCase / snake_case segments. */
function segments(name) {
  return name
    .split(/(?=[A-Z])|_/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the abbreviations §6 names, in declared identifiers. Spelled-out words instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          banned: { type: 'object', additionalProperties: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      banned:
        '`{{name}}` contains the abbreviation `{{abbrev}}`. §6: spell it out — `{{spelled}}`.',
    },
  },

  create(context) {
    const banned = { ...DEFAULT_BANNED, ...(context.options[0]?.banned ?? {}) };

    function check(node, name) {
      if (typeof name !== 'string') return;
      for (const seg of segments(name)) {
        if (seg in banned) {
          context.report({
            node,
            messageId: 'banned',
            data: { name, abbrev: seg, spelled: banned[seg] },
          });
          return; // one report per identifier, not one per segment
        }
      }
    }

    return {
      // Declarations only — §6 is about what you name a thing, and a
      // destructured prop or an imported binding is somebody else's name.
      'VariableDeclarator > Identifier.id': (node) => check(node, node.name),
      FunctionDeclaration: (node) => node.id && check(node.id, node.id.name),
      'ClassDeclaration > Identifier.id': (node) => check(node, node.name),
      TSTypeAliasDeclaration: (node) => node.id && check(node.id, node.id.name),
      TSInterfaceDeclaration: (node) => node.id && check(node.id, node.id.name),
    };
  },
};
