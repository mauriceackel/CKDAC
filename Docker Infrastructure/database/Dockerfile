FROM mongo:latest

RUN apt-get update -y

ADD mongo-init.sh /docker-entrypoint-initdb.d/

EXPOSE 27017

CMD ["mongod"]