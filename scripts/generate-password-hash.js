import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\nUse este hash no Supabase:');
  console.log(`INSERT INTO auth_users (username, email, password_hash, name, role, active)`);
  console.log(`VALUES ('admin', 'admin@pixsystem.com', '${hash}', 'Administrador', 'admin', 1);`);
});

