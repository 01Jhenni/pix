// Script para criar ícones PNG simples usando canvas (Node.js)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Para criar PNGs reais, precisaríamos de uma biblioteca como sharp ou canvas
// Por enquanto, vamos criar um HTML que pode ser usado para gerar os ícones
const createIconHTML = () => {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #020617; }
    .icon-container { width: 512px; height: 512px; position: relative; }
    .icon { width: 100%; height: 100%; border-radius: 20%; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 180px; font-weight: bold; font-family: Arial, sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div class="icon-container">
    <div class="icon">PIX</div>
  </div>
  <script>
    // Instruções: Use uma extensão do navegador para capturar a tela e salvar como PNG
    // Ou use: https://html2canvas.hertzen.com/
    console.log('Para gerar os ícones PNG:');
    console.log('1. Abra este HTML no navegador');
    console.log('2. Use uma ferramenta de captura de tela ou extensão');
    console.log('3. Salve como icon-512.png e redimensione para icon-192.png');
  </script>
</body>
</html>`;
};

const publicDir = path.join(__dirname, '..', 'public');
const htmlPath = path.join(publicDir, 'generate-icon.html');
fs.writeFileSync(htmlPath, createIconHTML());
console.log('✅ HTML para gerar ícone criado: generate-icon.html');
console.log('📱 Abra este arquivo no navegador e capture a tela para criar os ícones PNG');

// Criar um placeholder simples usando base64 (quadrado vermelho com texto PIX)
// Isso não é ideal, mas funciona como fallback
const createBase64Icon = (size) => {
  // SVG em base64
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PIX</text>
  </svg>`;
  
  return Buffer.from(svg).toString('base64');
};

// Salvar como data URL para uso temporário
const sizes = [192, 512];
sizes.forEach(size => {
  const base64 = createBase64Icon(size);
  const dataUrl = `data:image/svg+xml;base64,${base64}`;
  const infoPath = path.join(publicDir, `icon-${size}-info.txt`);
  fs.writeFileSync(infoPath, `Data URL para icon-${size}.png:\n${dataUrl}\n\nPara converter SVG para PNG, use:\n- https://cloudconvert.com/svg-to-png\n- Ou uma ferramenta online de conversão`);
  console.log(`✅ Info criado para icon-${size}.png`);
});

console.log('\n💡 Dica: Use os arquivos SVG gerados anteriormente e converta para PNG online');

