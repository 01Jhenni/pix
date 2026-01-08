import { getDatabase } from './db-loader.js';

/**
 * Cria usuário PIX padrão se não existir
 */
export async function seedDefaultUser() {
  try {
    const db = getDatabase();
    
    // Verificar se já existe usuário com esse CNPJ (com tratamento de timeout)
    let existing;
    try {
      existing = db.prepare('SELECT id FROM pix_users WHERE cnpj = ?').get('02429647000169');
    } catch (checkError) {
      const errorMsg = checkError.message || String(checkError);
      if (errorMsg.includes('Timeout') || errorMsg.includes('Tabela')) {
        console.warn('⚠️  Não foi possível verificar usuário padrão (tabela pode não existir ou conexão lenta)');
        return null;
      }
      throw checkError;
    }
    
    if (existing) {
      console.log('✅ Usuário PIX padrão já existe');
      return existing.id;
    }
  } catch (error) {
    // Se der erro, pode ser que a tabela não exista ainda
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('Timeout')) {
      console.warn('⚠️  Timeout ao verificar usuário padrão. Verifique a conexão com Supabase.');
      return null;
    }
    console.warn('⚠️  Não foi possível verificar usuário padrão:', errorMsg);
    return null;
  }
  
  try {
    const db = getDatabase();

  // Dados do usuário padrão (do JSON original)
  const defaultUser = {
    cnpj: '02429647000169',
    nome: 'VIDA OURO',
    gw_app_key: '42783cd412f343e8acb3d42219c1d9bf',
    basic_auth_base64: 'ZXlKcFpDSTZJbUptT1RRMk1tUXROekU0T1MwME5UZ3dMV0ZrT0RndFlXRmpZMll4SWl3aVkyOWthV2R2VUhWaWJHbGpZV1J2Y2lJNk1Dd2lZMjlrYVdkdlUyOW1kSGRoY21VaU9qRXlPRGc0TXl3aWMyVnhkV1Z1WTJsaGJFbHVjM1JoYkdGallXOGlPakY5OmV5SnBaQ0k2SWpCbFlXTTJaV0V0TkdVM01DMDBJaXdpWTI5a2FXZHZVSFZpYkdsallXUnZjaUk2TUN3aVkyOWthV2R2VTI5bWRIZGhjbVVpT2pFeU9EZzRNeXdpYzJWeGRXVnVZMmxoYkVsdWMzUmhiR0ZqWVc4aU9qRXNJbk5sY1hWbGJtTnBZV3hEY21Wa1pXNWphV0ZzSWpveExDSmhiV0pwWlc1MFpTSTZJbkJ5YjJSMVkyRnZJaXdpYVdGMElqb3hOelUzTkRNNU9EY3pNVFl5ZlE=',
    base_url: 'https://api-pix.bb.com.br/pix/v2',
    oauth_url: 'https://oauth.bb.com.br/oauth/token',
    chave_pix_recebedor: '02429647000169',
    nome_recebedor: 'VIDA OURO',
    cidade_recebedor: 'BELO HORIZONTE'
  };

    // Inserir usuário (garantindo que ativo = 1)
    let result;
    try {
      result = db.prepare(`
        INSERT INTO pix_users (
          cnpj, nome, gw_app_key, basic_auth_base64, base_url, oauth_url,
          chave_pix_recebedor, nome_recebedor, cidade_recebedor, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        defaultUser.cnpj,
        defaultUser.nome,
        defaultUser.gw_app_key,
        defaultUser.basic_auth_base64,
        defaultUser.base_url,
        defaultUser.oauth_url,
        defaultUser.chave_pix_recebedor,
        defaultUser.nome_recebedor,
        defaultUser.cidade_recebedor
      );
    } catch (insertError) {
      const errorMsg = insertError.message || String(insertError);
      if (errorMsg.includes('Timeout')) {
        console.warn('⚠️  Timeout ao criar usuário padrão. Verifique a conexão com Supabase.');
        return null;
      }
      throw insertError;
    }

    // Verificar se result existe e tem lastInsertRowid
    if (!result) {
      console.warn('⚠️  Não foi possível obter resultado da inserção. Verifique a conexão com Supabase.');
      return null;
    }
    
    // Verificar se tem lastInsertRowid ou se precisa buscar o ID de outra forma
    const userId = result.lastInsertRowid || (result.id ? result.id : null);
    
    if (!userId) {
      console.warn('⚠️  Não foi possível obter ID do usuário criado. Verifique a conexão com Supabase.');
      return null;
    }

    console.log('✅ Usuário PIX padrão criado com sucesso!');
    console.log(`   CNPJ: ${defaultUser.cnpj}`);
    console.log(`   Nome: ${defaultUser.nome}`);
    console.log(`   ID: ${userId}`);
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('   1. Extraia os certificados SSL do n8n (veja CERTIFICADOS_SSL.md)');
    console.log('   2. Coloque os arquivos cert.pem e key.pem na pasta certificates/');
    console.log('   3. Reinicie o servidor');
    console.log('');
    
    return userId;
  } catch (error) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('Timeout')) {
      console.warn('⚠️  Timeout ao criar usuário padrão. Verifique a conexão com Supabase.');
      return null;
    }
    if (errorMsg.includes('Tabela') && errorMsg.includes('não encontrada')) {
      console.warn('⚠️  Tabela pix_users não encontrada. Execute database/supabase-schema.sql no Supabase SQL Editor.');
      return null;
    }
    console.warn('⚠️  Erro ao criar usuário padrão:', errorMsg);
    return null;
  }
}

