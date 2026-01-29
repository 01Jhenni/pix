# Dockerfile para deploy no Terminus
FROM node:20-alpine

# Instalar dependências do sistema necessárias para certificados SSL
RUN apk add --no-cache openssl ca-certificates

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretório para certificados SSL (se não existir)
RUN mkdir -p certificates

# Expor porta (Terminus geralmente usa PORT do ambiente)
EXPOSE 3000

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]

