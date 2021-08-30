FROM node:lts-alpine

RUN apk update && apk add --no-cache nmap && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
      ghostscript


WORKDIR /app

COPY package*json ./

RUN npm install

COPY . .

ENV PORT=5000

EXPOSE 5000


CMD ["NODE_ENV=production", "node", "./index.js" ]