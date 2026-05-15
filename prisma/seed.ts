import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ALL_DASHBOARDS = [
  "dash_operacional",
  "dash_financeiro",
  "dash_frota",
  "metas",
  "relatorios",
  "usuarios",
];

async function main() {
  console.log("🌱 Criando usuários de teste...");

  const adminHash = await hash("admin@2025", 10);
  const clientHash = await hash("cliente@2025", 10);

  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin Luciana",
      email: "admin@luciana.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
      funcao: "Administrador",
      allowedDashboards: ALL_DASHBOARDS,
    },
  });

  console.log("✅ Admin criado:", admin.email);

  const client = await prisma.user.create({
    data: {
      name: "Cliente Luciana",
      email: "cliente@luciana.com",
      passwordHash: clientHash,
      role: Role.VIEWER,
      funcao: "Visualizador",
      allowedDashboards: ["dash_operacional"],
    },
  });

  console.log("✅ Cliente criado:", client.email);
  console.log("\n📋 Credenciais de teste:");
  console.log("   ADMIN  →  admin@luciana.com   /  admin@2025");
  console.log("   VIEWER →  cliente@luciana.com /  cliente@2025");
}

main()
  .then(() => {
    console.log("\n🌱 Seed finalizado.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
