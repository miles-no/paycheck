set -ex
RUN npx prisma generate
npm run prisma migrate deploy
npm run start
