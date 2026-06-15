#!/bin/sh
set -e
echo "✅ Banco disponível (via depends_on)! Rodando migrations..."
npx prisma migrate deploy
echo "🚀 Iniciando a API..."
exec node dist/server.js
