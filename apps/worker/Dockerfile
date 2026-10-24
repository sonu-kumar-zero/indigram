FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY apps/worker apps/worker
COPY packages/database packages/database
RUN npm run db:generate --workspace=@indigram/database \
  && npm run build --workspace=@indigram/database \
  && npm run build --workspace=@indigram/worker

CMD ["npm", "run", "start", "--workspace=@indigram/worker"]
