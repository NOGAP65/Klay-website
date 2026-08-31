/**
 * no-pure-black
 *
 * `#000`, `#000000` and `#1A1A1A` are banned on Klay. The palette varies in
 * lightness only and its deepest value is `ink` (#1D1D1D); a pure black beside
 * it reads as a different system, and #1A1A1A is close enough to ink to be a
 * mistake rather than a choice.
 *
 * ---------------------------------------------------------------------------
 * ON `includeComments`, WHICH DEFAULTS TO FALSE, AND WHY THAT IS NOT A DODGE.
 *
 * The governing rule is "no #000, #000000, #1A1A1A anywhere in src/". Taken
 * literally that includes comments — and at the time this rule was written the
 * ONLY two occurrences in the entire repository were in a comment that forbids
 * the colour:
 *
 *   src/components/home/StepsBar.tsx:25-26
 *   // Charcoal rather than black, because Klay has no black in it — #000000 and
 *   // #1A1A1A are both banned outright …
 *
 * A rule whose first run produces two findings, both of which are the
 * prohibition itself, teaches people to add disable comments. So comments are
 * off by default and the option is here to turn them on deliberately.
 *
 * ---------------------------------------------------------------------------
 * ON `flagRgbaBlack`, WHICH ALSO DEFAULTS TO FALSE.
 *
 * The hex ban is silent about `rgba(0,0,0,…)`, and the codebase uses it: the
 * configurator builds its raised-button shadows from rgba(0,0,0,0.28) upward,
 * while the blind renderer deliberately went the other way with a warm
 * rgba(20,16,10,…) and a comment explaining that a black shadow desaturates a
 * warm palette. Those two disagree, which is worth deciding — but it is a
 * decision, not a lint default. Turn this on once it is made.
 */

const HEX_PATTERN = /#(?:000000|000|1[Aa]1[Aa]1[Aa])\b/g;
const RGBA_BLACK_PATTERN = /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/g;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow #000, #000000 and #1A1A1A. Klay has no pure black; the deepest value is tokens.ink.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          includeComments: { type: 'boolean' },
          flagRgbaBlack: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      banned:
        '"{{value}}" is banned. Klay has no pure black — use tokens.ink (#1D1D1D) or tokens.charcoal (#303030).',
      rgbaBlack:
        'Pure-black rgba shadow. The renderers use a warm rgba(20,16,10,…) so a shadow does not desaturate the palette.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const includeComments = options.includeComments ?? false;
    const flagRgbaBlack = options.flagRgbaBlack ?? false;
    const source = context.sourceCode ?? context.getSourceCode();

    /** Report every match in a node's raw text, at the node. */
    function scan(node, text) {
      for (const [value] of text.matchAll(HEX_PATTERN)) {
        context.report({ node, messageId: 'banned', data: { value } });
      }
      if (flagRgbaBlack) {
        for (const _ of text.matchAll(RGBA_BLACK_PATTERN)) {
          context.report({ node, messageId: 'rgbaBlack' });
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') scan(node, node.value);
      },
      TemplateElement(node) {
        scan(node, node.value.raw);
      },
      'Program:exit'() {
        if (!includeComments) return;
        for (const comment of source.getAllComments()) {
          scan(comment, comment.value);
        }
      },
    };
  },
};
