# base node image
FROM node:18-bullseye-slim as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# Install openssl for Prisma
# hadolint ignore=DL3008,DL3009,DL3015
RUN apt-get update && apt-get install -y openssl

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /myapp

COPY package.json package-lock.json .npmrc ./
RUN npm install --production=false

# Setup production node_modules
FROM base as production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
COPY package.json package-lock.json .npmrc ./
RUN npm prune --production

# Build the app
FROM base as build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules

COPY prisma .
RUN npx prisma generate

COPY . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

#ENV DATABASE_URL=file:/data/sqlite.db
ENV PORT="8080"
ENV NODE_ENV="production"

# add shortcut for connecting to database CLI
#RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma

COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY --from=build /myapp/package.json /myapp/package.json
COPY --from=build /myapp/start.sh /myapp/start.sh
COPY --from=build /myapp/tsconfig.json /myapp/tsconfig.json
COPY --from=build /myapp/prisma /myapp/prisma

#CMD ["/myapp/start.sh"]
CMD [ "npm", "run", "start" ]