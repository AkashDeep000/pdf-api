FROM node:lts-alpine

RUN apk update && apk add --no-cache nmap && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
      ghostscript \
      imagemagick


WORKDIR /app

COPY policy.xml /etc/ImageMagick-6/policy.xml

COPY package*json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

ENV PORT=5000

EXPOSE 5000


CMD ["node", "./app.js" ]