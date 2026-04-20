import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

function requireAuth(c: any) {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  return null;
}

// GET /api/catalog — return suppliers + items for current user
app.get("/", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const [suppliers, items] = await Promise.all([
    prisma.catalogSupplier.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return c.json({ data: { suppliers, items } });
});

// POST /api/catalog/suppliers
app.post("/suppliers", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const body = await c.req.json<{ id: string; name: string; color: string }>();
  const supplier = await prisma.catalogSupplier.create({
    data: { id: body.id, name: body.name, color: body.color, userId: user.id },
  });
  return c.json({ data: supplier }, 201);
});

// PATCH /api/catalog/suppliers/:id
app.patch("/suppliers/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const body = await c.req.json<{ name: string; color: string }>();
  const { id } = c.req.param();

  await prisma.catalogSupplier.updateMany({
    where: { id, userId: user.id },
    data: { name: body.name, color: body.color },
  });
  // Also update supplierName on items
  await prisma.catalogItem.updateMany({
    where: { supplierId: id, userId: user.id },
    data: { supplierName: body.name },
  });

  return c.json({ data: { id, ...body } });
});

// DELETE /api/catalog/suppliers/:id
app.delete("/suppliers/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const { id } = c.req.param();
  // Items cascade via DB, but also scope to userId for safety
  await prisma.catalogItem.deleteMany({ where: { supplierId: id, userId: user.id } });
  await prisma.catalogSupplier.deleteMany({ where: { id, userId: user.id } });
  return c.body(null, 204);
});

// POST /api/catalog/items
app.post("/items", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const body = await c.req.json<{
    id: string;
    name: string;
    supplierId: string;
    supplierName: string;
    unit: string;
    category: string;
    description?: string;
  }>();

  const item = await prisma.catalogItem.create({
    data: { ...body, userId: user.id },
  });
  return c.json({ data: item }, 201);
});

// PATCH /api/catalog/items/:id
app.patch("/items/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  const { id } = c.req.param();
  const body = await c.req.json<{ name: string; unit: string; category: string; description?: string }>();

  const existing = await prisma.catalogItem.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Item not found" } }, 404);

  const updatedItem = await prisma.catalogItem.update({
    where: { id },
    data: { name: body.name, unit: body.unit, category: body.category, description: body.description },
  });

  return c.json({ data: updatedItem });
});

// DELETE /api/catalog/items/:id
app.delete("/items/:id", async (c) => {
  const guard = requireAuth(c);
  if (guard) return guard;
  const user = c.get("user")!;

  await prisma.catalogItem.deleteMany({ where: { id: c.req.param("id"), userId: user.id } });
  return c.body(null, 204);
});

export const catalogRouter = app;
