import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ---------------------------------------------------------------------------
// PATH ALIASES — must mirror `paths` in tsconfig.app.json exactly.
//
// TypeScript and Vite resolve imports independently: tsconfig's `paths` teaches
// the typechecker and the editor, `resolve.alias` teaches the bundler. An alias
// present in one and missing from the other produces the worst failure shape
// there is — code that typechecks clean and fails at build, or builds fine and
// shows red squiggles in every editor.
//
// There is no `@/*` catch-all, by design. See the note in tsconfig.app.json:
// the aliases are the layer boundary, so each one names a layer.
// ---------------------------------------------------------------------------
const alias = {
  '@/app': fileURLToPath(new URL('./src/app', import.meta.url)),
  '@/config': fileURLToPath(new URL('./src/config', import.meta.url)),
  '@/ds': fileURLToPath(new URL('./src/design-system', import.meta.url)),
  '@/features': fileURLToPath(new URL('./src/features', import.meta.url)),
  '@/shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
