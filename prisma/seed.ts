import { PrismaClient } from "@prisma/client";

import { prompts } from "./seed-prompts";

const prisma = new PrismaClient();

async function main() {
  // Idempotent-ish seed: insert prompts by unique promptText+mode+languageCode.
  // For v1 manual seeding this is sufficient and avoids accidental duplicates.
  for (const p of prompts) {
    const languageCode = p.languageCode ?? "any";
    const existing = await prisma.prompt.findFirst({
      where: { promptText: p.promptText, mode: p.mode, languageCode },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.prompt.create({
      data: {
        languageCode,
        mode: p.mode,
        minCefr: p.minCefr,
        maxCefr: p.maxCefr,
        topicTags: p.topicTags,
        safetyTags: p.safetyTags,
        requiredWords: p.requiredWords,
        promptText: p.promptText,
        source: p.source ?? "CURATED",
        status: p.status ?? "ACTIVE",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

