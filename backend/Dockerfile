FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4001

# node direto (não "npm start"): como processo principal do container, é o node que precisa
# receber o SIGTERM do deploy pra fazer o desligamento controlado (ver server.ts) — o npm
# no meio pode não repassar o sinal e o processo acaba morto à força.
CMD ["node", "dist/server.js"]
