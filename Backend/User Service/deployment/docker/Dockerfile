FROM node:lts-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install --production --no-package-lock

COPY --chown=node:node ./bin .

EXPOSE 8080

CMD [ "node", "Service.js" ]