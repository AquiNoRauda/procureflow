import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Auth guard helper
function requireAuth(c: any) {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  return null;
}

// GET /api/purchases — list all purchase items for the current user
app.get("/", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const items = await prisma.purchaseItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: items });
});

// POST /api/purchases — add or merge a purchase item
app.post("/", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const body = await c.req.json<{
    name: string;
    supplier: string;
    quantity: number;
    unit: string;
  }>();

  // Merge if same item+supplier already exists
  const existing = await prisma.purchaseItem.findFirst({
    where: {
      userId: user.id,
      name: body.name,
      supplier: body.supplier,
    },
  });

  if (existing) {
    const updated = await prisma.purchaseItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + body.quantity },
    });
    return c.json({ data: updated });
  }

  const item = await prisma.purchaseItem.create({
    data: {
      id: crypto.randomUUID(),
      name: body.name,
      supplier: body.supplier,
      quantity: body.quantity,
      unit: body.unit,
      userId: user.id,
    },
  });
  return c.json({ data: item }, 201);
});

// PATCH /api/purchases/:id — update quantity
app.patch("/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const { quantity } = await c.req.json<{ quantity: number }>();
  const { id } = c.req.param();

  if (quantity <= 0) {
    await prisma.purchaseItem.deleteMany({ where: { id, userId: user.id } });
    return c.body(null, 204);
  }

  const item = await prisma.purchaseItem.updateMany({
    where: { id, userId: user.id },
    data: { quantity },
  });

  if (item.count === 0) return c.json({ error: { message: "Not found" } }, 404);
  return c.json({ data: { id, quantity } });
});

// DELETE /api/purchases/:id
app.delete("/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  await prisma.purchaseItem.deleteMany({ where: { id: c.req.param("id"), userId: user.id } });
  return c.body(null, 204);
});

// DELETE /api/purchases — clear all
app.delete("/", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  await prisma.purchaseItem.deleteMany({ where: { userId: user.id } });
  return c.body(null, 204);
});

// DELETE /api/purchases/supplier/:name — clear by supplier
app.delete("/supplier/:name", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  await prisma.purchaseItem.deleteMany({
    where: { userId: user.id, supplier: c.req.param("name") },
  });
  return c.body(null, 204);
});

export const purchaseRouter = app;
