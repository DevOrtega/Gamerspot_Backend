FROM node:alpine AS build

WORKDIR /app

COPY ./app /app

RUN npm install && npm install -g @angular/cli && ng build --prod --base-href http://ec2-15-237-13-78.eu-west-3.compute.amazonaws.com

FROM nginx:alpine

WORKDIR /app

RUN apk update && apk add bash && rm -rf /var/cache/apk/*
RUN > /etc/nginx/conf.d/default.conf

COPY ./conf /etc/nginx/conf.d/

RUN cat /etc/nginx/conf.d/server.conf > /etc/nginx/conf.d/default.conf
RUN rm -rf /etc/nginx/conf.d/server.conf

COPY --from=build /app/dist /var/www/html/

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
