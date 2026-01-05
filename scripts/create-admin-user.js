import bcrypt from 'bcryptjs';

// Gerar hash para senha admin123
const password = 'admin123';
const hash = await bcrypt.hash(password, 10);

console.log('\n=== HASH GERADO ===');
console.log(`Senha: ${password}`);
console.log(`Hash: ${hash}`);
console.log('\n=== SQL PARA SUPABASE ===');
console.log(`
-- Execute este SQL no Supabase SQL Editor
INSERT INTO auth_users (username, email, password_hash, name, role, active)
VALUES (
  'admin',
  'admin@pixsystem.com',
  '${hash}',
  'Administrador',
  'admin',
  1
) ON CONFLICT (username) DO NOTHING;
`);

