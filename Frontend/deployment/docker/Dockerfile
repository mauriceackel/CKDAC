FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY deployment/nginx.conf /etc/nginx/nginx.conf

COPY build /usr/share/nginx/html

EXPOSE 8080

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
