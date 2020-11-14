FROM nginx:alpine

RUN apk update && apk add bash && rm -rf /var/cache/apk/*
RUN > /etc/nginx/conf.d/default.conf

COPY ./conf /etc/nginx/conf.d/

RUN cat /etc/nginx/conf.d/server.conf > /etc/nginx/conf.d/default.conf
RUN rm -rf /etc/nginx/conf.d/server.conf

COPY ./src /var/www/html/

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
