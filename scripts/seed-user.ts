/**
 * Script para criar/listar usuários de teste
 * Uso: npx tsx scripts/seed-user.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // List existing users
  const existing = await prisma.user.findMany({
    select: { email: true, name: true, role: true, mustChangePassword: true },
  });

  console.log("\n--- Usuários existentes ---");
  if (existing.length === 0) {
    console.log("(nenhum)");
  } else {
    existing.forEach((u) => console.log(`  ${u.email} | ${u.role} | mustChangePwd: ${u.mustChangePassword}`));
  }

  // Create admin test user if not exists
  const TEST_EMAIL = "admin@hdlog.com";
  const TEST_PASSWORD = "hdlog2026";

  const alreadyExists = existing.find((u) => u.email === TEST_EMAIL);
  if (!alreadyExists) {
    const passwordHash = await hash(TEST_PASSWORD, 10);
    await prisma.user.create({
      data: {
        name: "Admin HDLOG",
        email: TEST_EMAIL,
        passwordHash,
        role: "ADMIN",
        funcao: "Administrador",
        allowedDashboards: [
          "dash_operacional",
          "dash_financeiro",
          "dash_frota",
          "metas",
          "relatorios",
          "usuarios",
        ],
      },
    });
    console.log(`\n✓ Usuário criado: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  } else {
    console.log(`\n(usuário ${TEST_EMAIL} já existe)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
