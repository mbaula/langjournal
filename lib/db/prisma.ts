import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/** Dev hot reload can keep a Prisma client from before `prisma generate`. */
function isStalePrismaClient(client: PrismaClient): boolean {
  const flashcard = (
    client as PrismaClient & {
      flashcard?: { findMany?: unknown };
    }
  ).flashcard;
  return typeof flashcard?.findMany !== "function";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStalePrismaClient(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Lazy Prisma accessor — re-resolves the client when Turbopack/HMR leaves a
 * stale singleton missing newly generated models (e.g. `flashcard`).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
