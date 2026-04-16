const express = require('express');
const router = express.Router();
const fetch = global.fetch || require('node-fetch');
const { v7: uuidv7 } = require('uuid');
const store = require('../services/profileStore');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function classifyAgeGroup(age) {
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
}

async function callGenderize(name) {
  const res = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Genderize');
  return res.json();
}

async function callAgify(name) {
  const res = await fetch(`https://api.agify.io?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Agify');
  return res.json();
}

async function callNationalize(name) {
  const res = await fetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Nationalize');
  return res.json();
}

router.post('/profiles', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (name === undefined) return res.status(400).json({ status: 'error', message: 'Missing name' });
    if (!isNonEmptyString(name)) return res.status(422).json({ status: 'error', message: 'Invalid name' });

    const existing = store.findByName(name);
    if (existing) return res.status(200).json({ status: 'success', message: 'Profile already exists', data: existing });

    // Call external APIs in parallel
    const [gResp, aResp, nResp] = await Promise.allSettled([
      callGenderize(name),
      callAgify(name),
      callNationalize(name),
    ]);

    if (gResp.status !== 'fulfilled') return res.status(502).json({ status: '502', message: 'Genderize returned an invalid response' });
    if (aResp.status !== 'fulfilled') return res.status(502).json({ status: '502', message: 'Agify returned an invalid response' });
    if (nResp.status !== 'fulfilled') return res.status(502).json({ status: '502', message: 'Nationalize returned an invalid response' });

    const genderize = gResp.value;
    const agify = aResp.value;
    const nationalize = nResp.value;

    if (!genderize || genderize.gender == null || Number(genderize.count) === 0) {
      return res.status(502).json({ status: '502', message: 'Genderize returned an invalid response' });
    }
    if (!agify || agify.age == null) {
      return res.status(502).json({ status: '502', message: 'Agify returned an invalid response' });
    }
    if (!nationalize || !Array.isArray(nationalize.country) || nationalize.country.length === 0) {
      return res.status(502).json({ status: '502', message: 'Nationalize returned an invalid response' });
    }

    const topCountry = nationalize.country.reduce((best, cur) => (cur.probability > (best.probability || 0) ? cur : best), {});

    const profile = {
      id: uuidv7(),
      name: String(name).toLowerCase(),
      gender: genderize.gender,
      gender_probability: Number(genderize.probability),
      sample_size: Number(genderize.count),
      age: Number(agify.age),
      age_group: classifyAgeGroup(Number(agify.age)),
      country_id: topCountry.country_id,
      country_probability: Number(topCountry.probability),
      created_at: new Date().toISOString(),
    };

    store.add(profile);

    return res.status(201).json({ status: 'success', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

router.get('/profiles/:id', (req, res) => {
  const { id } = req.params;
  const profile = store.findById(id);
  if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });
  return res.status(200).json({ status: 'success', data: profile });
});

router.get('/profiles', (req, res) => {
  const { gender, country_id, age_group } = req.query || {};
  const items = store.list({ gender, country_id, age_group });
  const data = items.map((p) => ({ id: p.id, name: p.name, gender: p.gender, age: p.age, age_group: p.age_group, country_id: p.country_id }));
  return res.status(200).json({ status: 'success', count: data.length, data });
});

router.delete('/profiles/:id', (req, res) => {
  const { id } = req.params;
  const ok = store.removeById(id);
  if (!ok) return res.status(404).json({ status: 'error', message: 'Profile not found' });
  return res.status(204).send();
});

module.exports = router;
