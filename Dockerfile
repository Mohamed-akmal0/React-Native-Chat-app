# use the official bun image
FROM oven/bun:latest

# set the working directory in the container
WORKDIR /app

#build web frontend
WORKDIR /app/web
COPY web/package.json web/bun.lock* ./
RUN bun install --frozen-lockfile
COPY web/ ./

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

#build the web frontend
RUN bun run build

#install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY backend/ ./

# expose the port
EXPOSE 3000
#set the non-sensitve defaults
ENV PORT=3000
ENV NODE_ENV=production

#start the server
CMD ["bun", "index.ts"]