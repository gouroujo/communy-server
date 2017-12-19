FROM arm64v8/node:8-alpine
COPY ./qemu-aarch64-static /usr/bin/qemu-aarch64-static

RUN mkdir -p /usr/src
WORKDIR /usr/src

ENV NODE_PATH app/
ENV PORT 3000
ENV PORT_WORKER 8000

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

RUN yarn global add pm2

COPY package.json /usr/src/
COPY yarn.lock /usr/src/
RUN yarn install --production

# Bundle app source
COPY ./app /usr/src/app
COPY ./pm2.json /usr/src/pm2.json

EXPOSE 3000
EXPOSE 8000

CMD [ "pm2-docker", "start", "pm2.json" ]
