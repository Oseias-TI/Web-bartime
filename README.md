# Bartime

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**Bartime** é uma plataforma completa (Full-Stack) para o gerenciamento de barbearias. Este repositório contém tanto o código do Frontend quanto do Backend da aplicação.

## 📦 Estrutura do Projeto

O repositório está dividido em duas partes principais:

- **`/frontend`**: Aplicação web desenvolvida com [Next.js](https://nextjs.org/) (versão 16.2), React 19 e Tailwind CSS 4. Interface moderna e responsiva para usuários e administradores da barbearia.
- **`/back end`**: API desenvolvida com Node.js, Express, TypeScript e Prisma ORM. Fornece todos os recursos necessários para agendamentos, pagamentos (Stripe), relatórios, notificações por e-mail e armazenamento na nuvem (AWS S3).

## 🚀 Funcionalidades

- **Gestão de Agendamentos:** Criação, atualização e cancelamento de serviços de forma dinâmica.
- **Processamento de Pagamentos:** Integração direta com a API do Stripe para transações seguras.
- **Gestão de Usuários e Autenticação:** Login seguro com JWT e senhas criptografadas.
- **Upload de Imagens:** Envio de avatares salvos diretamente no Amazon S3.
- **Notificações Automatizadas:** Lembretes de agendamentos e notificações por e-mail automáticas.
- **Relatórios Gerenciais:** Exportação de dados financeiros e de clientes em formatos PDF e Excel, com visualização de gráficos via Recharts no painel web.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16.2** (React 19)
- **Tailwind CSS v4** para estilização
- **Zod & React Hook Form** para validação de formulários
- **Recharts** para gráficos e relatórios visuais

### Backend
- **Node.js & TypeScript**
- **Express.js** (Framework web)
- **Prisma ORM** (Gestão do banco de dados relacional)
- **Redis** (Cache de listagens e escalabilidade)
- **Stripe** (Integração de pagamentos)
- **AWS S3 & Multer** (Upload de arquivos)
- **Nodemailer** (Envio de e-mails)
- **Docker & Docker Compose** (Containerização completa)
- **ELK Stack (Elasticsearch & Kibana)** (Agregação de logs e rastreamento via `TraceID`)
- **Prometheus & Grafana** (Métricas de aplicação, latência e throughput)
- **Jest & Supertest** (Testes unitários e de integração E2E com padrão AAA)

## 🏗️ Arquitetura, Qualidade e Performance (Tech Forge)

O projeto adota uma arquitetura de Monolito Modularizada, priorizando o **Clean Code** e **SOLID**:
- **Padrões de Testes:** Utilização de `Factories`, Isolamento de BD e padronização AAA (Arrange, Act, Assert).
- **Cobertura de Testes:** Implementação de testes Unitários e Integrados focados nas regras de negócio e estabilidade da API (ex: `Client CRUD`).
- **Performance:** Estratégia de Cache com **Redis** para listagens complexas visando redução de Throughput de banco de dados e ganho de SLA (< 200ms por request).
- **Observabilidade:** Todas as requisições geram um `TraceID` único (UUID) que perpassa os logs no **Kibana**, facilitando troubleshooting.
- **Métricas (SLA):** Rota `/metrics` instrumentada pelo `prom-client` para rastrear latência e requisições/s. Dashboards no Grafana completam o ecossistema.

## ⚙️ Como Executar o Projeto

Para rodar a aplicação localmente, você precisará iniciar tanto o Backend quanto o Frontend.

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 18+)
- [Docker](https://www.docker.com/) (Para o banco de dados)

### 1. Backend

Navegue até a pasta do backend:
```bash
cd "back end"
```

Instale as dependências:
```bash
npm install
```

Configure as variáveis de ambiente (copie `.env.example` para `.env` e preencha as chaves do banco de dados, Stripe, AWS e SMTP):
```bash
cp .env.example .env
```

Suba o banco de dados via Docker e rode as migrações:
```bash
npm run docker:up
npm run db:push
```

Inicie a API em modo de desenvolvimento:
```bash
npm run dev
```

*A API estará rodando em `http://localhost:3333` (ou porta configurada).* Para mais detalhes sobre scripts, consulte o [README do Backend](file:///c:/TCC/back%20end/README.md).

### 2. Frontend

Em um novo terminal, navegue até a pasta do frontend:
```bash
cd frontend
```

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

*A aplicação web estará acessível em `http://localhost:3000`.* Para mais detalhes, consulte o [README do Frontend](file:///c:/TCC/frontend/README.md).

---
Feito com ♥ por Oseias-TI
