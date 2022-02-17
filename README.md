# De Ceuvel API

GraphQL API for De Ceuvel data.

## Requirements

In order to launch this web-service, you need to have installed `docker` and `docker-compose` on your system.
You also need to create a `.env` file in the root directory of this project, with the following entries:

```
MONGO_INITDB_ROOT_USERNAME=<USERNAME>
MONGO_INITDB_ROOT_PASSWORD=<PASSWORD>
MONGO_INITDB_DATABASE=deceuvel
MONGO_DATABASE_PORT=27017
APP_PORT=3000
IMG_TAG=local
```

## Launch Instructions

To launch, simply execute the following command:
```
docker-compose up -d --build
```

The deployment will take a few seconds before it is ready to receive requests due to loading the database with the data at startup.

## Usage

Send the GraphQL queries to:
```
http://<DOMAIN>:<APP_PORT>/graphql
```
