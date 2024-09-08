FROM node:20.17-alpine3.20

RUN mkdir -p /home/node/mini-jira-3/node_modules \
 && chown -R node:node /home/node/mini-jira-3

COPY \
  package.json \
  package-lock.json \
  /home/node/mini-jira-3/

USER node

WORKDIR /home/node/mini-jira-3
RUN npm install

COPY \
  --chown=node:node \
  src \
  /home/node/mini-jira-3/src/

EXPOSE 5000

ENTRYPOINT [ "npm", "run", "start" ]
