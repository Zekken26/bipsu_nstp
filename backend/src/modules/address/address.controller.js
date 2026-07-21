import prisma from '../../db/prisma.js';

export async function listProvinces(req, res) {
  const provinces = await prisma.province.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: provinces });
}

export async function listMunicipalities(req, res) {
  const { provinceCode } = req.query;
  if (!provinceCode) {
    return res.status(400).json({ success: false, error: 'provinceCode query parameter is required.' });
  }
  const municipalities = await prisma.municipality.findMany({
    where: { provinceCode },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: municipalities });
}

export async function searchBarangays(req, res) {
  const { municipalityCode, q } = req.query;
  if (!municipalityCode) {
    return res.status(400).json({ success: false, error: 'municipalityCode query parameter is required.' });
  }
  const where = { municipalityCode };
  if (q && q.trim()) {
    where.name = { contains: q.trim(), mode: 'insensitive' };
  }
  const barangays = await prisma.barangay.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 50,
  });
  res.json({ success: true, data: barangays });
}

export async function listBarangays(req, res) {
  const { municipalityCode } = req.query;
  if (!municipalityCode) {
    return res.status(400).json({ success: false, error: 'municipalityCode query parameter is required.' });
  }
  const barangays = await prisma.barangay.findMany({
    where: { municipalityCode },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: barangays });
}
