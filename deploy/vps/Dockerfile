# Image for a small VPS (2 GB): the web app is built beforehand (npm run build -w @aihot/web) on another
# machine and copied in, so the server only installs production dependencies. Build from the repo root:
#   docker build -f deploy/vps/Dockerfile -t cinemahot-app:<版本> .
# Copy deploy/vps/Dockerfile.dockerignore over the release copy's .dockerignore first: it keeps apps/web/build,
# and Docker's legacy builder (no Buildx) only reads .dockerignore from the build context root.
FROM node:24-trixie-slim
WORKDIR /app
COPY . .
RUN test -f apps/web/build/server/index.js \
  && npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir -p /data && chown node:node /data
ENV NODE_ENV=production
USER node
CMD ["node", "apps/web/server.ts"]
