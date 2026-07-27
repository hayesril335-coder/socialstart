# SocialStart

A mobile-first social platform for creators, communities, storefronts, and the One For One attention exchange.

## Run the interface

```bash
cd client
pnpm install
pnpm dev
```

The Express, Socket.IO, and Prisma foundation is in `server/`. Copy `.env.example` to `.env`, configure PostgreSQL and provider credentials, then run `pnpm install && pnpm dev` from that directory.

The current client is a complete interactive product prototype. External services (Google OAuth, Cloudinary, Stripe, LiveKit) require credentials before production use.
