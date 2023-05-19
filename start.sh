#!/bin/sh

echo This file is how Fly starts the server (configured in fly.toml). Before starting
echo the server though, we need to run any prisma migrations that haven't yet been
echo run, which is why this file exists in the first place.
echo Learn more: https://community.fly.io/t/sqlite-not-getting-setup-properly/4386

set -ex
npx prisma migrate deploy
npm run start
