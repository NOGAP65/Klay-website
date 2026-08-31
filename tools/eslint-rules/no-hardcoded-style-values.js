/**
 * no-hardcoded-style-values
 *
 * Bans a raw number or hex literal as the value of a design-carrying property
 * inside a JSX `style={{ … }}` object. Those values belong to the design system;
 * a literal at a call site is how a codebase ends up with 128 distinct pixel
 * values and a 21-role type scale that nothing consumes.
 *
 * WHY THIS RULE AND NOT A CSS LINTER: this project has no stylesheets. Every
 * visual property on the site is an inline style object (627 of them at the time
 * this was written), so the only place a token can be bypassed is here.
 *
 * WHAT IT DOES NOT CATCH, deliberately:
 *   - Computed values (`padding: isMobile ? 20 : 80`). The ternary's branches are
 *     literals, and they ARE caught — but a value read from a variable is not,
 *     because the rule cannot know whether that variable came from a token.
 *   - Longhands (`paddingTop`, `marginLeft`). The governing spec names eight
 *     properties; `extraProperties` is the option for widening that.
 *   - `0` and `1`. A zero is a reset and a one is a hairline border; neither is a
 *     scale step, and flagging 303 of them would bury the 300 findings that matter.
 */

const DEFAULT_PROPERTIES = [
  'color',
  'backgroundColor',
  'padding',
  'margin',
  'gap',
  'fontSize',
  'borderRadius',
  'boxShadow',
];

/** Values that are not design decisions and would only create noise. */
const IGNORED_NUMBERS = new Set([0, 1]);

const HEX = /#[0-9A-Fa-f]{3,8}\b/;
const PX = /-?\d+(\.\d+)?px/;

/** design-system/tokens is where these literals are supposed to live. */
const isExempt = (filename, exemptPattern) =>
  new RegExp(exemptPattern).test(filename.split('\\').join('/'));

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow numeric and hex literals for design-carrying properties in inline style objects; use a design token instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          extraProperties: { type: 'array', items: { type: 'string' } },
          exemptPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcoded:
        '"{{prop}}: {{value}}" is a hardcoded design value. Use a token from @/ds instead.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const properties = new Set([
      ...DEFAULT_PROPERTIES,
      ...(options.extraProperties ?? []),
    ]);
    const exemptPattern = options.exemptPattern ?? 'design-system/tokens/';
    const filename = context.filename ?? context.getFilename();

    if (isExempt(filename, exemptPattern)) return {};

    /** Is this the value half of `style={{ … }}`? */
    function isInsideStyleAttribute(node) {
      let current = node;
      while (current) {
        if (
          current.type === 'JSXAttribute' &&
          current.name &&
          current.name.name === 'style'
        ) {
          return true;
        }
        // Stop climbing at a function boundary — a style object built in a
        // helper is still a style object, but a literal in unrelated code
        // several frames up is not.
        if (
          current.type === 'FunctionDeclaration' ||
          current.type === 'FunctionExpression' ||
          current.type === 'ArrowFunctionExpression'
        ) {
          return false;
        }
        current = current.parent;
      }
      return false;
    }

    function offendingValue(valueNode) {
      if (valueNode.type === 'Literal') {
        if (typeof valueNode.value === 'number') {
          return IGNORED_NUMBERS.has(valueNode.value) ? null : String(valueNode.value);
        }
        if (typeof valueNode.value === 'string') {
          if (HEX.test(valueNode.value) || PX.test(valueNode.value)) return valueNode.value;
        }
        return null;
      }
      // `padding: -4` parses as a unary expression, not a negative literal.
      if (
        valueNode.type === 'UnaryExpression' &&
        valueNode.operator === '-' &&
        valueNode.argument.type === 'Literal' &&
        typeof valueNode.argument.value === 'number'
      ) {
        return IGNORED_NUMBERS.has(valueNode.argument.value)
          ? null
          : '-' + valueNode.argument.value;
      }
      if (valueNode.type === 'TemplateLiteral') {
        const raw = valueNode.quasis.map((q) => q.value.raw).join('${…}');
        if (HEX.test(raw) || PX.test(raw)) return raw;
      }
      return null;
    }

    return {
      Property(node) {
        const key =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? String(node.key.value)
              : null;
        if (!key || !properties.has(key)) return;
        if (!isInsideStyleAttribute(node)) return;

        const value = offendingValue(node.value);
        if (value === null) return;

        context.report({
          node: node.value,
          messageId: 'hardcoded',
          data: { prop: key, value },
        });
      },
    };
  },
};
