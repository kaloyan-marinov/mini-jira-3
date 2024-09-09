FROM node:20.17-alpine3.20

RUN mkdir -p /home/node/mini-jira-3
WORKDIR /home/node/mini-jira-3

COPY \
  package.json package-lock.json \
  ./
RUN npm install

RUN mkdir -p /home/node/mini-jira-3/containerization
COPY \
  ./containerization/wait-for.sh \
  /home/node/mini-jira-3/containerization/

COPY \
  ./src \
  ./src

RUN chown -R node:node .
USER node

EXPOSE 5000

ENTRYPOINT [ "npm", "run", "start" ]
