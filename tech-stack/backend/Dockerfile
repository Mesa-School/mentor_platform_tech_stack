# --- build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
# argon2 needs a toolchain to build its native binding
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev

# --- runtime stage -------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
USER node
EXPOSE 4000
# Run pending migrations, then boot. Drop the migrate step if your deploy pipeline owns it.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
