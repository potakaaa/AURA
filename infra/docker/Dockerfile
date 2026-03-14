# AURA API — production image for services/api
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config and sources
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json* ./
COPY apps ./apps
COPY packages ./packages
COPY services ./services

# Install dependencies (single install from root)
RUN pnpm install --frozen-lockfile

# Build the API
RUN pnpm --filter api build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built API and its dependencies
COPY --from=base /app/services/api/package.json ./
COPY --from=base /app/services/api/dist ./dist
COPY --from=base /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
