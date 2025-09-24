ARG INICIO_VARS_METHOD=dotenv

FROM node:21-alpine3.19 AS build

RUN mkdir -p /usr/src/inicio
WORKDIR /usr/src/inicio

COPY .*rc ./
COPY *.json ./
COPY .prettier* ./
COPY next.config.ts ./

RUN npm install

COPY public/ public/
COPY src/ src/

FROM build AS dev

EXPOSE $PORT

CMD ["npm", "run", "dev"]

# prod-build-with-dotenv
FROM build AS prod-build-with-dotenv

ARG INICIO_DOTENV_FILE=.env.production
COPY ${INICIO_DOTENV_FILE} .env.production

# prod-build-with-var
FROM build AS prod-build-with-content-var

ARG INICIO_VARS_CONTENT
RUN echo "${INICIO_VARS_CONTENT}" | base64 -d > .env.production

# prod-build
FROM prod-build-with-${INICIO_VARS_METHOD} AS prod-build
RUN npm run build

# prod
FROM nginx:alpine AS prod

COPY --from=prod-build /usr/src/tts-fe/build /usr/share/nginx/html
COPY nginx.tts.conf /etc/nginx/conf.d/default.conf
