# syntax=docker/dockerfile:1

# ---------- odvisnosti ----------
FROM node:20-alpine AS deps
WORKDIR /app
# package*.json = vedno package.json + package-lock.json, če obstaja
COPY package*.json ./
# reproducirana namestitev, če je lockfile; sicer generirano (lockfile manjka v tvojem checkoutu)
RUN if [ -f package-lock.json ]; then \
      echo "npm ci (package-lock.json najden)" && npm ci --no-audit --no-fund; \
    else \
      echo "npm install (package-lock.json manjka — priporočeno: npm install --package-lock-only)" && npm install --no-audit --no-fund; \
    fi

# ---------- gradnja ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy DATABASE_URL le za fazo gradnje (Next ob "collect page data" uvozi module;
# dejanske povezave z bazo med gradnjo ni — bazo se poveže šele ob zagonu).
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npm run build

# ---------- produkcijska slika ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Europe/Ljubljana \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN apk add --no-cache tzdata && addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
