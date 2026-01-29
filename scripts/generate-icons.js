// Script para gerar ícones do PWA
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar ícone SVG simples (será usado como fallback)
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PIX</text>
</svg>`;
};

// Criar ícones
const publicDir = path.join(__dirname, '..', 'public');
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const svgPath = path.join(publicDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Ícone ${size}x${size} criado: icon-${size}.svg`);
});

// Criar também PNGs simples (usando data URL base64 de um quadrado colorido)
// Para produção, você deve substituir por ícones reais
const createPNGPlaceholder = (size) => {
  // Criar um canvas simples em base64
  // Por enquanto, vamos criar um arquivo que será substituído
  const placeholder = `<!-- Placeholder para icon-${size}.png - Substitua por um ícone real -->`;
  fs.writeFileSync(path.join(publicDir, `icon-${size}.png.txt`), placeholder);
};

sizes.forEach(size => {
  createPNGPlaceholder(size);
});

console.log('\n📱 Para completar a instalação PWA:');
console.log('   1. Substitua icon-192.png e icon-512.png por ícones reais');
console.log('   2. Ou use os arquivos SVG gerados como fallback');
console.log('   3. Os ícones devem ser quadrados e ter fundo transparente ou sólido');

