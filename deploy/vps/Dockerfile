# Image for a small VPS (2 GB): the web app is built beforehand (npm run build -w @aihot/web), so the image
# only installs production dependencies. Built by .github/workflows/release-image.yml on a version tag;
# BuildKit reads deploy/vps/Dockerfile.dockerignore, which keeps apps/web/build. By hand, from the repo root:
#   docker buildx build -f deploy/vps/Dockerfile -t cinehot-app:<版本> .
FROM node:24-trixie-slim
WORKDIR /app
COPY . .
RUN test -f apps/web/build/server/index.js \
  && npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir -p /data && chown node:node /data
ENV NODE_ENV=production
USER node
CMD ["node", "apps/web/server.ts"]
