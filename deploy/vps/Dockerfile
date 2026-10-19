# Image for a small VPS (2 GB): the web app is built beforehand (npm run build -w @aihot/web) on another
# machine and copied in, so the server only installs production dependencies. Build from the repo root:
#   docker build -f deploy/vps/Dockerfile -t cinemahot-app:<版本> .
# deploy/vps/Dockerfile.dockerignore (not the root .dockerignore) decides what is sent: it keeps apps/web/build.
FROM node:24-trixie-slim
WORKDIR /app
COPY . .
RUN test -f apps/web/build/server/index.js \
  && npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir -p /data && chown node:node /data
ENV NODE_ENV=production
USER node
CMD ["node", "apps/web/server.ts"]
