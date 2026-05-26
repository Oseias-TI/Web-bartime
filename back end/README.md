# BarberFlow API

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Back-end API do sistema **BarberFlow**, uma plataforma completa para gerenciamento de barbearias. Esta API fornece todos os recursos necessários para agendamentos, pagamentos, relatórios, notificações e muito mais.

## 🚀 Tecnologias

O projeto foi desenvolvido utilizando as seguintes tecnologias:

- **[Node.js](https://nodejs.org/)** com **[TypeScript](https://www.typescriptlang.org/)**
- **[Express](https://expressjs.com/)** (Framework web)
- **[Prisma ORM](https://www.prisma.io/)** (Banco de dados relacional)
- **[Zod](https://zod.dev/)** (Validação de dados)
- **[JWT](https://jwt.io/) & [Bcrypt](https://www.npmjs.com/package/bcryptjs)** (Autenticação e segurança)
- **[Stripe](https://stripe.com/)** (Processamento de pagamentos)
- **[AWS S3](https://aws.amazon.com/s3/) & [Multer](https://github.com/expressjs/multer)** (Upload e armazenamento de imagens)
- **[Nodemailer](https://nodemailer.com/)** (Envio de e-mails)
- **[PDFKit](https://pdfkit.org/) & [ExcelJS](https://github.com/exceljs/exceljs)** (Geração de relatórios)
- **[Docker](https://www.docker.com/) & Docker Compose** (Containerização)

## ✨ Funcionalidades Principais

- **Autenticação e Autorização:** Login seguro com JWT e senhas criptografadas.
- **Gestão de Agendamentos:** Criação, atualização e cancelamento de serviços.
- **Processamento de Pagamentos:** Integração direta com a API do Stripe.
- **Upload de Arquivos:** Envio de imagens/avatares salvos diretamente no Amazon S3.
- **Notificações:** Lembretes de agendamentos e notificações por e-mail (com rotinas automáticas via `node-cron`).
- **Geração de Relatórios:** Exportação de dados financeiros e de clientes em formatos PDF e Excel.
- **Segurança:** Rate limiting (`express-rate-limit`) e headers de segurança (`helmet`).

## 🛠️ Pré-requisitos

Antes de começar, você vai precisar ter as seguintes ferramentas instaladas em sua máquina:
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org/en/) (Versão 18+)
- [Docker](https://www.docker.com/) (Opcional, mas recomendado para o banco de dados)

## ⚙️ Como executar o projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/Oseias-TI/BackEnd-BarberFlow.git
cd BackEnd-BarberFlow
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com base no arquivo de exemplo:
```bash
cp .env.example .env
```
*Lembre-se de preencher as chaves do Stripe, AWS, SMTP e URL do banco de dados no seu arquivo `.env`.*

### 3. Instalar as dependências
```bash
npm install
```

### 4. Configurar o Banco de Dados (Com Docker)
Você pode subir a infraestrutura completa do banco usando o Docker Compose:
```bash
npm run docker:up
```

### 5. Rodar as migrações do banco (Prisma)
```bash
npm run db:push
# ou
npm run db:migrate
```

### 6. Iniciar a aplicação
Para rodar em modo de desenvolvimento (com hot-reload):
```bash
npm run dev
```

A API estará rodando em `http://localhost:3000` (ou na porta definida no `.env`).

## 📜 Scripts Disponíveis

No arquivo `package.json`, você encontrará os seguintes scripts úteis:

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila o código TypeScript para JavaScript na pasta `/dist`.
- `npm run start`: Inicia o servidor em modo de produção (a partir da pasta `/dist`).
- `npm run db:studio`: Abre a interface visual do Prisma Studio para gerenciar o banco.
- `npm run docker:up`: Sobe os containers Docker em background.
- `npm run docker:down`: Para e remove os containers Docker.
- `npm run docker:logs`: Exibe os logs do container da API.
- `npm run docker:reset`: Reseta os containers (remove os volumes e recria tudo).

## 🔒 Segurança

Este projeto utiliza diversas medidas de segurança para proteção de dados:
- Hash de senhas utilizando o `bcryptjs`.
- Proteção contra ataques de força bruta com `express-rate-limit`.
- Configuração segura de cabeçalhos HTTP via `helmet`.
- Validação estrita de todos os payloads de entrada utilizando o `Zod`.

---
Feito com ♥ por Oseias-TI
