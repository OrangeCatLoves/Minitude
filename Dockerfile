# Minitude, one container: the game (built) and the server in the same process. Used by Fly.io (see docs/DEPLOY.md), works on any host that runs Docker.
#   docker build -t minitude .
#   docker run -p 8787:8787 -v minitude-data:/data -e DATABASE_FILE=/data/minitude.db minitude

# ---- build: install everything, build the game, then drop the development tools
FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 normally arrives as a ready-made binary; these tools are only the fallback when it has to be compiled
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
# the package lists first, so this slow layer is reused until a dependency changes
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN npm ci
COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm run build -w @minitude/core && npm run build -w @minitude/web
RUN npm prune --omit=dev

# ---- run: the server's own code (TypeScript, run directly by tsx), its dependencies, and the built game
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core ./packages/core
COPY --from=build /app/packages/server ./packages/server
COPY --from=build /app/packages/web/dist ./packages/web/dist
# the server looks for the game's files relative to its own folder
WORKDIR /app/packages/server
ENV PORT=8787
EXPOSE 8787
# ONE process (about 110 MB): not `npm start`, which adds two wrapper processes on top
CMD ["node", "--import", "tsx", "src/index.ts"]
