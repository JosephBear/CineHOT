# Isolated migration fixture. Reuse the exact source and prebuilt web bundle from the
# archived release used to build Oracle's November image. Install native ARM dependencies.
FROM --platform=linux/amd64 ghcr.io/josephbear/cinehot-app@sha256:8607d4b2bf1a2b2d4cd48961ca12eaa393c5f1b91ae12529c15cc5dd6e9849da AS original
FROM node:24.22.1-trixie-slim AS base
WORKDIR /app
COPY --from=original /app /app
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && mkdir -p /data && chown node:node /data
ENV NODE_ENV=production
USER node
FROM base AS worker
COPY compose.ts /app/packages/backend/src/reports/compose.ts
