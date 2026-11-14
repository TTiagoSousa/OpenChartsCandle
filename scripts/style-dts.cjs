// Type declaration so `import 'openchartscandle/style.css'` type-checks in any TS project.
require('fs').writeFileSync(require('path').join(__dirname, '..', 'dist', 'style.css.d.ts'), 'export {};\n');
