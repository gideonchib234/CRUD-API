const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'profiles.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf8');
}

function loadAll() {
  ensureDataFile();
  const content = fs.readFileSync(FILE, 'utf8');
  try {
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

function saveAll(items) {
  ensureDataFile();
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2), 'utf8');
}

function findById(id) {
  const items = loadAll();
  return items.find((p) => p.id === id) || null;
}

function findByName(name) {
  if (!name) return null;
  const items = loadAll();
  return items.find((p) => p.name.toLowerCase() === name.toLowerCase()) || null;
}

function add(profile) {
  const items = loadAll();
  items.push(profile);
  saveAll(items);
  return profile;
}

function list(filters) {
  let items = loadAll();
  if (!filters) return items;
  const { gender, country_id, age_group } = filters;
  items = items.filter((p) => {
    if (gender && String(p.gender).toLowerCase() !== String(gender).toLowerCase()) return false;
    if (country_id && String(p.country_id).toLowerCase() !== String(country_id).toLowerCase()) return false;
    if (age_group && String(p.age_group).toLowerCase() !== String(age_group).toLowerCase()) return false;
    return true;
  });
  return items;
}

function removeById(id) {
  const items = loadAll();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  saveAll(items);
  return true;
}

module.exports = { findById, findByName, add, list, removeById };
