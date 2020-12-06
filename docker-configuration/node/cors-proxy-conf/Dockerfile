FROM node:alpine

WORKDIR /node-server

RUN apk update && apk add bash && rm -rf /var/cache/apk/*

COPY ./cors-proxy .

RUN npm install

EXPOSE 8080

CMD ["node","server.js"]