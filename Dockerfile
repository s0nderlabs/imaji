# imaji: Next.js app + HTML renderer (Chromium + ffmpeg) in one image.
# The renderer needs a real browser and an encoder, which is why this does
# not run on a serverless platform. Works on Railway, Fly, Render, a VPS.

FROM oven/bun:1.3-debian AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-debian AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.3-debian AS runtime
WORKDIR /app
# IMAJI_CHROME_NO_SANDBOX: the image runs as root, and Chromium refuses to
# start as root without --no-sandbox. See chromeArgs() in src/render/render.ts.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CHROME_PATH=/usr/bin/chromium \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    IMAJI_DATA_DIR=/data \
    IMAJI_CHROME_NO_SANDBOX=1 \
    PORT=3000
# Chromium + ffmpeg + the fonts Chromium needs to shape text; the compositions
# ship their own webfonts, these are the fallbacks and the emoji-free base.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg fonts-liberation fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000
CMD ["bun", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
