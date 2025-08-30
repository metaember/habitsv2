# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Debug: List prisma migrations
RUN ls -la prisma/migrations/

# BUG WORKASROUND: SEE https://github.com/prisma/prisma/issues/25817
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG DATABASE_URL
ARG DOMAIN
ARG NEXT_PUBLIC_AUTH_URL
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV DOMAIN=${DOMAIN}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# BUG WORKAROUND: SEE https://github.com/prisma/prisma/issues/25817
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Create non-root user
RUN addgroup -g 1002 -S nodejs
RUN adduser -S nextjs -u 1002

# Copy built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]