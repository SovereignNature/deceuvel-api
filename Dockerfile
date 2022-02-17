ARG CUSTOM_NODE_VERSION=16.14.0-alpine3.15

# Create base layer with dependencies
FROM node:$CUSTOM_NODE_VERSION AS dependencies
WORKDIR /deceuvel-api
COPY ["package.json", "./"]
RUN ["npm", "install", "--production"] #, "--verbose"]

# Reduce dependencies' size
RUN npm install modclean -g && \
    rm -rf docs/ coverage/ src/ tests/ typings/ .git/ .github/ *.md && \
    rm -rf node_modules/*/test/ node_modules/*/tests/ && \
    npm prune && \
    modclean -n default:safe --run && \
    npm uninstall -g modclean

#ARG CUSTOM_NODE_VERSION
#RUN echo "NODE = $CUSTOM_NODE_VERSION"

FROM softonic/node-prune:latest AS pruner
COPY --from=dependencies /deceuvel-api/node_modules /deceuvel-api/node_modules
RUN node-prune /deceuvel-api/node_modules

#ARG CUSTOM_NODE_VERSION #=16.14.0-alpine3.15
#RUN echo "NODE = $CUSTOM_NODE_VERSION"

# Create final layer
FROM node:$CUSTOM_NODE_VERSION AS production
WORKDIR /deceuvel-api
COPY --from=pruner /deceuvel-api/node_modules ./node_modules

COPY ["./src", "."]

ARG IMG_TAG_VAR=1.0.0
ENV IMG_TAG=$IMG_TAG_VAR

ARG CUSTOM_NODE_VERSION
#RUN echo "NODE = $CUSTOM_NODE_VERSION"
#RUN echo "VAR = $IMG_TAG_VAR"
#RUN echo "ENV = $IMG_TAG"

EXPOSE 80/tcp

ENTRYPOINT ["node", "--max-old-space-size=4096", "app.js"]
