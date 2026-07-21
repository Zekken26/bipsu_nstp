import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PSGC_BASE = 'https://psgc.gitlab.io/api';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function seedAddress() {
  const existing = await prisma.province.count();
  if (existing > 0) {
    console.log('Address data already seeded (%d provinces). Skipping.', existing);
    await prisma.$disconnect();
    return;
  }

  console.log('Fetching provinces...');
  const provinces = await fetchJson(`${PSGC_BASE}/provinces`);

  for (const prov of provinces) {
    const provinceCode = prov.code || prov.id;
    await prisma.province.create({ data: { code: provinceCode, name: prov.name } });

    console.log(`  Fetching municipalities for ${prov.name}...`);
    const municipalities = await fetchJson(`${PSGC_BASE}/provinces/${provinceCode}/municipalities.json`);

    for (const mun of municipalities) {
      const munCode = mun.code || mun.id;
      await prisma.municipality.create({
        data: { code: munCode, name: mun.name, provinceCode },
      });

      console.log(`    Fetching barangays for ${mun.name}...`);
      const barangays = await fetchJson(`${PSGC_BASE}/municipalities/${munCode}/barangays.json`);

      const barangayData = barangays.map((b) => ({
        code: b.code || b.id,
        name: b.name,
        municipalityCode: munCode,
      }));

      if (barangayData.length > 0) {
        await prisma.barangay.createMany({ data: barangayData });
      }
    }
  }

  const counts = {
    provinces: await prisma.province.count(),
    municipalities: await prisma.municipality.count(),
    barangays: await prisma.barangay.count(),
  };
  console.log('Address seeding complete:', counts);
  await prisma.$disconnect();
}

seedAddress().catch((err) => {
  console.error('Failed to seed address data:', err);
  process.exit(1);
});
