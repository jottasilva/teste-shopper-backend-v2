# API de Medição de Água e Gás

Este projeto implementa uma API REST para gerenciar leituras individualizadas de consumo de água e gás, utilizando IA (Google Gemini) para reconhecimento de valores em imagens de medidores.

## Requisitos

- Docker e Docker Compose instalados
- Chave de API do Google Gemini

## Como executar

1. Clone o repositório:
```bash
git clone [URL-DO-REPOSITORIO]
cd [NOME-DO-REPOSITORIO]
```

2. Crie um arquivo `.env` na raiz do projeto com sua chave do Google Gemini:
```
GEMINI_API_KEY=sua_chave_do_gemini_aqui
```

3. Execute o projeto com Docker Compose:
```bash
docker-compose up -d
```

A aplicação estará disponível em `http://localhost:80`.

## Endpoints

### POST /upload
Upload de uma imagem de medidor para reconhecimento por IA.

### PATCH /confirm
Confirma ou corrige o valor lido pela IA.

### GET /{customerCode}/list
Lista as medições realizadas por um cliente, com filtro opcional por tipo de medição (água ou gás).

## Documentação da API

A documentação completa da API com Swagger está disponível em `http://localhost:80/api-docs`.

## Testes

Para executar os testes:

```bash 
# Dentro do container
docker exec -it measure-api npm test

# Ou localmente (se tiver Node.js instalado)
npm test
```

## Estrutura do Projeto

```
src/
├── controllers/    # Controladores da aplicação
├── services/       # Camada de serviço com lógica de negócio
├── repositories/   # Acesso ao banco de dados
├── models/         # Definição de tipos e modelos
├── routes/         # Definição de rotas
├── utils/          # Utilitários e funções auxiliares
├── middlewares/    # Middlewares do Express
└── index.ts        # Ponto de entrada da aplicação

tests/              # Testes unitários e de integração
uploads/            # Pasta para armazenar as imagens enviadas
```

## Tecnologias Utilizadas

- Node.js com TypeScript
- Express.js para a API REST
- PostgreSQL para banco de dados
- Google Gemini API para reconhecimento de imagens
- Jest para testes
- Docker para conteinerização
- Swagger para documentação da API