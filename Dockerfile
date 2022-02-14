FROM node:16.14.0

WORKDIR /deceuvel-api

COPY package.json ./
RUN npm install #--verbose

COPY app.js ./
#COPY ./data ./data/
COPY ./graphql ./graphql/
COPY ./models ./models/

EXPOSE ${APP_PORT}

CMD node --max-old-space-size=4096 app.js
