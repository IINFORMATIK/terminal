FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Установить git, если требуется
ARG INSTALL_GIT=false
RUN if [ "$INSTALL_GIT" = "true" ]; then apt-get update && apt-get install -y git; fi

EXPOSE 3000

CMD ["node", "server.js"]
