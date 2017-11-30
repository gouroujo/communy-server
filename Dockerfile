FROM arm64v8/node:8-alpine
COPY ./qemu-aarch64-static /usr/bin/qemu-aarch64-static

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY package.json /usr/src/
COPY yarn.lock /usr/src/
RUN yarn

# Bundle app source
COPY ./static /usr/src/static
COPY ./pages /usr/src/pages
COPY ./lib /usr/src/lib
COPY ./components /usr/src/components
COPY ./containers /usr/src/containers
COPY ./hocs /usr/src/hocs

RUN yarn build
EXPOSE 3000

CMD ["yarn", "start"]
