FROM node:alpine

WORKDIR /node-server

RUN apk update && apk add bash && rm -rf /var/cache/apk/*

COPY ./conf .

RUN npm install

EXPOSE 3000

CMD ["node","server.js"]