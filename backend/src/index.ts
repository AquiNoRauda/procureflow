import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { purchaseRouter } from "./routes/purchases";
import { catalogRouter } from "./routes/catalog";
import { ordersRouter } from "./routes/orders";
import { accountRouter } from "./routes/account";
import { backupRouter } from "./routes/backup";
import { prisma } from "./prisma";
import { randomUUID } from "crypto";

export type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>();

const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

app.use("*", logger());

// Auth session middleware — populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// App routes
app.route("/api/purchases", purchaseRouter);
app.route("/api/catalog", catalogRouter);
app.route("/api/orders", ordersRouter);
app.route("/api/account", accountRouter);
app.route("/api/backup", backupRouter);

// Startup migration: assign orphan PurchaseItems (no orderId) to a "Previous Order"
async function runStartupMigration() {
  try {
    // Use raw query since orderId is now non-nullable in the Prisma schema,
    // but legacy rows in SQLite may still have NULL values.
    const orphanItems = await prisma.$queryRaw<{ id: string; userId: string }[]>`
      SELECT id, userId FROM PurchaseItem WHERE orderId IS NULL
    `;

    if (orphanItems.length === 0) return;

    // Group by userId
    const byUser: Record<string, { id: string; userId: string }[]> = {};
    for (const item of orphanItems) {
      if (!byUser[item.userId]) byUser[item.userId] = [];
      byUser[item.userId]!.push(item);
    }

    // For each user, create a "Previous Order" and assign items
    for (const [userId, items] of Object.entries(byUser)) {
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          name: "Previous Order",
          status: "completed",
          completedAt: new Date(),
          userId,
        },
      });
      await prisma.$executeRaw`
        UPDATE PurchaseItem SET orderId = ${order.id} WHERE userId = ${userId} AND orderId IS NULL
      `;
      console.log(`Migrated ${items.length} items for user ${userId} to order ${order.id}`);
    }
  } catch (e) {
    console.error("Startup migration error:", e);
  }
}

runStartupMigration();

const port = Number(process.env.PORT) || 3000;

export default { port, fetch: app.fetch };
