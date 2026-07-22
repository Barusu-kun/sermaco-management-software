// desktop/scripts/copy-renderer.js
// Copie le build Vite de l'interface web (../web/dist) vers ./renderer
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'web', 'dist');
const dest = path.join(__dirname, '..', 'renderer');

if (!fs.existsSync(src)) {
  console.error('❌ Build web introuvable :', src);
  console.error("   Lancez d'abord le build de l'interface web.");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log('✅ Renderer copié :', dest);
