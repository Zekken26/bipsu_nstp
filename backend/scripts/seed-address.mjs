import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PSGC_BASE = 'https://psgc.gitlab.io/api';
const BATCH_SIZE = 20;
const FETCH_TIMEOUT = 30000;
const MAX_RETRIES = 3;

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

async function fetchJsonWithTimeout(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw new Error(`Failed after ${retries} retries: ${err.message} (${url})`);
      console.log(`    Retry ${attempt}/${retries} for ${url}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function seedAddress() {
  const existing = await prisma.province.count();
  if (existing > 0) {
    console.log('Address data already seeded (%d provinces). Skipping.', existing);
    await prisma.$disconnect();
    return;
  }

  console.log('Fetching provinces...');
  const provinces = await fetchJsonWithTimeout(`${PSGC_BASE}/provinces`);

  const allMunicipalities = [];

  for (const prov of provinces) {
    const provinceCode = prov.code || prov.id;
    await prisma.province.create({ data: { code: provinceCode, name: prov.name } });

    const municipalities = await fetchJsonWithTimeout(
      `${PSGC_BASE}/provinces/${provinceCode}/municipalities.json`
    );

    for (const mun of municipalities) {
      allMunicipalities.push({
        code: mun.code || mun.id,
        name: mun.name,
        provinceCode,
      });
    }
  }

  console.log(`Seeding ${allMunicipalities.length} municipalities...`);
  const munBatches = chunk(allMunicipalities, 500);
  for (const batch of munBatches) {
    await prisma.municipality.createMany({ data: batch, skipDuplicates: true });
  }

  const allBarangayData = [];
  const munBatchesForFetch = chunk(allMunicipalities, BATCH_SIZE);
  let done = 0;

  for (const batch of munBatchesForFetch) {
    const results = await Promise.allSettled(
      batch.map((mun) =>
        fetchJsonWithTimeout(
          `${PSGC_BASE}/municipalities/${mun.code}/barangays.json`
        ).then((barangays) =>
          barangays.map((b) => ({
            code: b.code || b.id,
            name: b.name,
            municipalityCode: mun.code,
          }))
        )
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allBarangayData.push(...result.value);
      }
    }

    done += batch.length;
    if (done % 100 === 0 || done === allMunicipalities.length) {
      console.log(`  Fetched barangays for ${done}/${allMunicipalities.length} municipalities...`);
    }
  }

  console.log(`Seeding ${allBarangayData.length} barangays...`);
  const brgyBatches = chunk(allBarangayData, 1000);
  for (const batch of brgyBatches) {
    await prisma.barangay.createMany({ data: batch, skipDuplicates: true });
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
  console.error('Failed to seed address data:', err.message);
  process.exit(1);
});
