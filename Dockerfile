FROM arm64v8/node:8-alpine
COPY ./qemu-aarch64-static /usr/bin/qemu-aarch64-static

RUN mkdir -p /usr/src
WORKDIR /usr/src

ENV NODE_PATH app/
ENV PORT 3000

COPY package.json /usr/src/
COPY yarn.lock /usr/src/
RUN yarn

# Bundle app source
COPY ./app /usr/src/app

EXPOSE 3000

CMD ["node", "app/server.js"]
