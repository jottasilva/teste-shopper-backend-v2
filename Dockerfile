# Dockerfile
FROM node:18-slim

WORKDIR /app

# Instalação de dependências do sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o código da aplicação
COPY . .

# Compilar TypeScript
RUN npm run build

# Criar pasta de uploads se não existir
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

# Expor porta
EXPOSE 3000

# Usar dumb-init como entrypoint para lidar corretamente com sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/index.js"]