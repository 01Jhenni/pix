// Este arquivo deve ser importado PRIMEIRO, antes de qualquer outro módulo
// Desabilita verificação SSL para APIs do BB que requerem certificados customizados
if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️  SSL verification disabled for BB API (requires custom certificates)');
}

