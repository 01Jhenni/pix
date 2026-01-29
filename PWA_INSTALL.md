# 📱 Instalação PWA - PIX

O sistema PIX agora é um **Progressive Web App (PWA)** que pode ser instalado no seu celular e funciona como um aplicativo nativo!

## 🚀 Como Instalar no Celular

### Android (Chrome/Edge)

1. Abra o sistema no navegador Chrome ou Edge
2. Toque no menu (três pontos) no canto superior direito
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme a instalação
5. O app aparecerá na sua tela inicial como um aplicativo nativo

### iOS (Safari)

1. Abra o sistema no Safari
2. Toque no botão de compartilhar (quadrado com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Personalize o nome (opcional) e toque em **"Adicionar"**
5. O app aparecerá na sua tela inicial

## ✨ Funcionalidades PWA

### ✅ Atualização em Tempo Real
- O sistema atualiza automaticamente a cada **5 segundos**
- Indicador visual mostra quando está em modo "Tempo Real"
- Pausa automaticamente quando a aba não está visível (economiza bateria)

### ✅ Funcionamento Offline
- Service Worker cacheia recursos essenciais
- Funciona parcialmente mesmo sem internet
- Sincroniza automaticamente quando a conexão voltar

### ✅ Notificações Push (Futuro)
- Receba notificações sobre novas transações
- Alertas de pagamentos recebidos
- Avisos de problemas no sistema

### ✅ Experiência Nativa
- Sem barra de endereço quando instalado
- Tela cheia como app nativo
- Ícone na tela inicial
- Atalhos rápidos para seções principais

## 🔧 Configurações Técnicas

### Service Worker
- Cache automático de recursos
- Atualização em background
- Suporte offline básico

### Manifest
- Nome: **PIX - Sistema de Gerenciamento**
- Tema: Vermelho (#ef4444)
- Modo: Standalone (tela cheia)
- Orientação: Retrato

### Ícones
- 192x192px (ícone padrão)
- 512x512px (tela de splash)
- Formatos: SVG e PNG

## 📊 Monitoramento em Tempo Real

O sistema atualiza automaticamente:
- **Dashboard**: KPIs, gráficos e estatísticas
- **Usuários PIX**: Lista de usuários cadastrados
- **Transações**: Status e novas transações
- **API Keys**: Chaves de API ativas

### Indicador Visual
Um indicador no canto superior direito mostra:
- 🟢 **Verde pulsante**: Atualização em tempo real ativa
- Pausa automaticamente quando a aba não está visível

## 🛠️ Desenvolvimento

### Gerar Ícones
```bash
node scripts/generate-icons.js
```

### Testar PWA Localmente
1. Execute o servidor: `npm start`
2. Acesse via HTTPS (necessário para PWA)
3. Use `localhost` ou configure um domínio local

### Verificar Service Worker
1. Abra DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Verifique se está registrado e ativo

## 📝 Notas

- **HTTPS obrigatório**: PWAs requerem HTTPS em produção
- **Ícones**: Substitua os ícones SVG/PNG por versões profissionais
- **Notificações**: Requer configuração adicional de Push API
- **Cache**: Limpe o cache se houver problemas de atualização

## 🐛 Solução de Problemas

### App não instala
- Verifique se está usando HTTPS
- Confirme que o manifest.json está acessível
- Verifique os ícones (devem existir)

### Atualização não funciona
- Limpe o cache do navegador
- Verifique o Service Worker em DevTools
- Recarregue a página forçando (Ctrl+Shift+R)

### Não funciona offline
- Verifique se o Service Worker está registrado
- Confirme que os recursos estão no cache
- Algumas funcionalidades requerem conexão (API calls)

---

**Versão PWA**: 2.0.0  
**Última atualização**: 2024

