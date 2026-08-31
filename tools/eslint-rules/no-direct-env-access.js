/**
 * no-direct-env-access
 *
 * `import.meta.env` may be read in exactly one file: src/config/env.ts. Every
 * other module imports a named, typed value from there.
 *
 * WHY IT MATTERS HERE SPECIFICALLY: Vite inlines `import.meta.env.VITE_*` into
 * the browser bundle at build time. One file reading it is a boundary you can
 * audit in a second; twenty files reading it is a boundary nobody can hold in
 * their head, and the first time somebody reaches for a variable that turns out
 * not to be VITE_-prefixed, the failure is silent — `undefined` at runtime
 * rather than an error at build.
 *
 * At the time this rule was written there was exactly ONE read in the whole of
 * src/ (src/components/Turnstile.tsx:35, VITE_TURNSTILE_SITE_KEY), so this rule
 * starts life at one violation and its job is to keep it there.
 *
 * `process.env` is banned outright in src/ — there is no Node process in a
 * browser, and the server variables are read through netlify/lib/env.ts, which
 * this rule does not cover because it does not lint netlify/.
 */

const DEFAULT_ALLOWED = 'src/config/env.ts';

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow import.meta.env and process.env outside the single config module that owns them.',
    },
    schema: [
      {
        type: 'object',
        properties: { allowedFile: { type: 'string' } },
        additionalProperties: false,
      },
    ],
    messages: {
      importMetaEnv:
        'Read environment variables from @/config, not import.meta.env directly. Only {{allowed}} may touch it.',
      processEnv:
        'process.env does not exist in the browser. Read from @/config instead.',
    },
  },

  create(context) {
    const allowed = context.options[0]?.allowedFile ?? DEFAULT_ALLOWED;
    const filename = (context.filename ?? context.getFilename())
      .split('\\')
      .join('/');

    if (filename.endsWith(allowed)) return {};

    return {
      // import.meta.env — the MetaProperty is `import.meta`; we want the member
      // access on top of it, so the report lands on `import.meta.env` and not
      // on every bare `import.meta`.
      MemberExpression(node) {
        if (
          node.object.type === 'MetaProperty' &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta' &&
          !node.computed &&
          node.property.type === 'Identifier' &&
          node.property.name === 'env'
        ) {
          context.report({
            node,
            messageId: 'importMetaEnv',
            data: { allowed },
          });
          return;
        }

        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'process' &&
          !node.computed &&
          node.property.type === 'Identifier' &&
          node.property.name === 'env'
        ) {
          context.report({ node, messageId: 'processEnv' });
        }
      },
    };
  },
};
