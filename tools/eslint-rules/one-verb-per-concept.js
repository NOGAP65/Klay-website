/**
 * one-verb-per-concept
 *
 * SPECIFICATION.md §6: "Pick one verb per concept and never synonyms. If
 * network retrieval is `fetch`, there is no `get`, no `load`, no `retrieve`.
 * Synonyms make a codebase unsearchable."
 *
 * ---------------------------------------------------------------------------
 * IT ENFORCES A CHOSEN VOCABULARY, IT DOES NOT INFER ONE.
 *
 * The rule cannot tell whether a function touches the network, and any attempt
 * to guess would be wrong in both directions — §6's own table has `get` as the
 * correct prefix for a pure accessor (`getBasePrice`) and the WRONG one for
 * network retrieval. A rule that flagged every `get` would contradict the
 * section it enforces.
 *
 * So the canonical verb per family is CONFIGURED, below, and the rule flags the
 * synonyms of a verb that has been chosen. Changing the vocabulary is editing
 * this list, deliberately, in one place — which is what §6 asks for.
 *
 * TWO FAMILIES ARE DELIBERATELY ABSENT, because Phase 0 measured them and found
 * the apparent inconsistency was not one:
 *
 *   DELETE   `drop` looked like a synonym for `remove`. `dropMetres` and
 *            `dropPx` are curtain DROP — the vertical dimension of a window
 *            covering. Domain vocabulary, not a verb. Flagging it would rename
 *            a measurement into nonsense.
 *
 *   RENDER   24 `draw*` functions inside the renderers are the most internally
 *            consistent naming in the codebase, and they are E-08. A rule that
 *            cannot fire on them anyway should not carry a policy about them.
 *
 * Recorded here rather than in a tracker because this file is where the next
 * person will be tempted to add them back.
 * ---------------------------------------------------------------------------
 */

/** canonical verb -> the synonyms that are not to be used for that concept. */
const DEFAULT_FAMILIES = {
  fetch: ['load', 'retrieve'],
  create: ['make', 'build'],
  calculate: ['compute', 'calc'],
};

function firstSegment(name) {
  const [first] = name.split(/(?=[A-Z])|_/);
  return (first ?? '').toLowerCase();
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'One verb per concept — flag synonyms of a canonical verb chosen in the rule options.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          families: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      synonym:
        '`{{name}}` starts with `{{verb}}`. This codebase uses `{{canonical}}` for that concept — §6: one verb per concept, never synonyms.',
    },
  },

  create(context) {
    const families = { ...DEFAULT_FAMILIES, ...(context.options[0]?.families ?? {}) };
    const synonymOf = new Map();
    for (const [canonical, synonyms] of Object.entries(families)) {
      for (const s of synonyms) synonymOf.set(s, canonical);
    }

    function check(node, name) {
      if (typeof name !== 'string') return;
      const verb = firstSegment(name);
      // A bare verb is a name, not a prefix — `load` alone says nothing about
      // a family, and flagging it would catch a variable called `build`.
      if (name.toLowerCase() === verb) return;
      const canonical = synonymOf.get(verb);
      if (canonical) {
        context.report({ node, messageId: 'synonym', data: { name, verb, canonical } });
      }
    }

    return {
      FunctionDeclaration: (node) => node.id && check(node.id, node.id.name),
      'VariableDeclarator > Identifier.id': (node) => {
        // Only when it is bound to a function — this is about verbs, and a
        // `const buildNumber = 7` is a noun phrase.
        const init = node.parent?.init;
        if (!init) return;
        if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
          check(node, node.name);
        }
      },
    };
  },
};
