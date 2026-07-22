# api/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Dépendances (prisma CLI inclus pour db push / generate au runtime)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# Code source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Synchronise le schéma puis démarre l'API.
# (Utilise `prisma db push` : aucun fichier de migration requis.)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node src/app.js"]
