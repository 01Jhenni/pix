-- Schema do banco de dados para Supabase
-- Execute este SQL no Supabase SQL Editor

-- Tabela de usuários PIX
CREATE TABLE IF NOT EXISTS pix_users (
  id BIGSERIAL PRIMARY KEY,
  cnpj TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  gw_app_key TEXT NOT NULL,
  basic_auth_base64 TEXT NOT NULL,
  base_url TEXT DEFAULT 'https://api-pix.bb.com.br/pix/v2',
  oauth_url TEXT DEFAULT 'https://oauth.bb.com.br/oauth/token',
  chave_pix_recebedor TEXT,
  nome_recebedor TEXT,
  cidade_recebedor TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações/recorrências
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  pix_user_id BIGINT NOT NULL REFERENCES pix_users(id) ON DELETE CASCADE,
  txid TEXT NOT NULL,
  id_rec TEXT,
  contrato TEXT,
  cpf_devedor TEXT,
  nome_devedor TEXT,
  valor_primeiro_pagamento TEXT,
  valor_recorrencia TEXT,
  data_inicial TEXT,
  periodicidade TEXT,
  politica_retentativa TEXT,
  status TEXT,
  pix_copia_e_cola TEXT,
  qr_code_image TEXT,
  jornada TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de perfis white label
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  pix_user_id BIGINT NOT NULL REFERENCES pix_users(id) ON DELETE CASCADE,
  brand_name TEXT,
  brand_logo TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  success_color TEXT DEFAULT '#10b981',
  danger_color TEXT DEFAULT '#ef4444',
  warning_color TEXT DEFAULT '#f59e0b',
  info_color TEXT DEFAULT '#3b82f6',
  custom_css TEXT,
  custom_js TEXT,
  footer_text TEXT,
  header_text TEXT,
  favicon TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  pix_user_id BIGINT NOT NULL REFERENCES pix_users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  active INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_pix_user ON transactions(pix_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
CREATE INDEX IF NOT EXISTS idx_transactions_id_rec ON transactions(id_rec);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pix_user ON user_profiles(pix_user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_pix_user ON api_keys(pix_user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_pix_users_updated_at BEFORE UPDATE ON pix_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - opcional, ajuste conforme necessário
ALTER TABLE pix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir tudo - ajuste conforme sua necessidade de segurança)
CREATE POLICY "Allow all operations on pix_users" ON pix_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on api_keys" ON api_keys FOR ALL USING (true) WITH CHECK (true);

