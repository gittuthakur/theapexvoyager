import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  // Existing effects synchronize URL filters, dialogs and saved preferences. Keep
  // compiler migration diagnostics visible without rewriting these flows in a
  // stability phase. Rules of Hooks and the remaining correctness rules stay errors.
  { files: ['**/*.{js,jsx,ts,tsx}'], rules: { 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/immutability': 'warn' } },
  globalIgnores(['.next/**', '.tmp/**', 'test-results/**', 'next-env.d.ts'])
]);
