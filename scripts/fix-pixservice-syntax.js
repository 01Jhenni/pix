#!/usr/bin/env node
/**
 * Corrige SyntaxError em services/pixService.js (remove linha "};" extra).
 * Rode NO SERVIDOR quando o pull ainda tiver o arquivo antigo:
 *   cd /root/pix && node scripts/fix-pixservice-syntax.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '..', 'services', 'pixService.js');

let content = fs.readFileSync(filePath, 'utf8');

// Padrão no servidor antigo: throw new Error(finalErrorMsg);\n  };\n  }
// Remover a linha "};" entre o throw e o "}"
const bad = /(throw new Error\(finalErrorMsg\);\s*\n)\s*\};\s*\n(\s*\})/;
if (bad.test(content)) {
  content = content.replace(bad, '$1$2');
  fs.writeFileSync(filePath, content);
  console.log('OK: pixService.js corrigido (linha }; extra removida).');
} else {
  console.log('Arquivo ja esta correto.');
}

process.exit(0);
