/**
 * Exemplo para PM2: define BB_OAUTH_TOKEN para o processo enxergar o token.
 * Copie para ecosystem.config.cjs e preencha BB_OAUTH_TOKEN com o token completo do n8n/BB.
 * Depois: pm2 start ecosystem.config.cjs
 * (Usar .cjs porque o projeto tem "type": "module" e o PM2 carrega o config como CommonJS.)
 */
module.exports = {
  apps: [
    {
      name: 'pix-system',
      script: '/root/pix/server.js',
      cwd: '/root/pix',
      env: {
        NODE_ENV: 'production',
        BB_OAUTH_TOKEN: 'COLE_AQUI_O_TOKEN_COMPLETO_DO_BB'
      }
    }
  ]
};
