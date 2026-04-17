const axios = require('axios');
const uuid = require('uuid');
const Profile = require('../models/schema');
const mongoose = require('mongoose');


/**
 * Helper: Classify age based on requirements
 */
const classifyAgeGroup = (age) => {
    if (age <= 12) return 'child';
    if (age <= 19) return 'teenager';
    if (age <= 59) return 'adult';
    return 'senior';
};

/**
 * POST /api/profiles
 * Creates or retrieves an existing profile
 */
exports.createProfile = async (req, res) => {
    const { name } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: "error", message: "Missing or empty name" });
    }

    const normalizedName = name.toLowerCase().trim();

    // 2. Idempotency Check (DB)
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ status: 'error', message: 'Database not connected' });
    }
    const existing = await Profile.findOne({ name: normalizedName }).lean();
    if (existing) {
        return res.status(200).json({ status: 'success', message: 'Profile already exists', data: existing });
    }

    try {
        // 3. Parallel External API Calls
        const [genderRes, ageRes, nationRes] = await Promise.all([
            axios.get(`https://api.genderize.io?name=${encodeURIComponent(normalizedName)}`),
            axios.get(`https://api.agify.io?name=${encodeURIComponent(normalizedName)}`),
            axios.get(`https://api.nationalize.io?name=${encodeURIComponent(normalizedName)}`)
        ]);

        // 4. Edge Case Handling (Upstream validation)
        if (!genderRes.data || genderRes.data.gender == null || Number(genderRes.data.count) === 0) {
            return res.status(502).json({ status: '502', message: 'Genderize returned an invalid response' });
        }
        if (!ageRes.data || ageRes.data.age == null) {
            return res.status(502).json({ status: '502', message: 'Agify returned an invalid response' });
        }
        if (!nationRes.data || !Array.isArray(nationRes.data.country) || nationRes.data.country.length === 0) {
            return res.status(502).json({ status: '502', message: 'Nationalize returned an invalid response' });
        }

        // 5. Data Extraction & Transformation
        const topCountry = nationRes.data.country.reduce((prev, curr) => 
            (curr.probability > prev.probability) ? curr : prev
        );

        const generateId = (uuid.v7 || uuid.v4).bind(uuid);

        const newProfile = new Profile({
            id: generateId(),
            name: normalizedName,
            gender: genderRes.data.gender,
            gender_probability: genderRes.data.probability,
            sample_size: genderRes.data.count,
            age: ageRes.data.age,
            age_group: classifyAgeGroup(ageRes.data.age),
            country_id: topCountry.country_id,
            country_probability: topCountry.probability,
            created_at: new Date(),
        });

        const saved = await newProfile.save();
        return res.status(201).json({ status: 'success', data: saved.toObject() });

    } catch (error) {
        // If axios error, try to map to the external API that failed
        if (error && error.config && error.config.url) {
            const url = error.config.url;
            if (url.includes('genderize')) return res.status(502).json({ status: '502', message: 'Genderize returned an invalid response' });
            if (url.includes('agify')) return res.status(502).json({ status: '502', message: 'Agify returned an invalid response' });
            if (url.includes('nationalize')) return res.status(502).json({ status: '502', message: 'Nationalize returned an invalid response' });
        }
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * GET /api/profiles
 * List profiles with filtering
 */
exports.getAllProfiles = (req, res) => {
    (async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ status: 'error', message: 'Database not connected' });
            }
            let { gender, country_id, age_group } = req.query;
            const filter = {};
            if (gender) filter.gender = new RegExp(`^${gender}$`, 'i');
            if (country_id) filter.country_id = new RegExp(`^${country_id}$`, 'i');
            if (age_group) filter.age_group = new RegExp(`^${age_group}$`, 'i');

            const items = await Profile.find(filter).lean();
            const data = items.map(({ id, name, gender, age, age_group, country_id }) => ({ id, name, gender,
                 age, age_group, country_id }));
            return res.status(200).json({ status: 'success', count: data.length, data });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    })();
};

/**
 * GET /api/profiles/:id
 */
exports.getProfileById = (req, res) => {
    (async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ status: 'error', message: 'Database not connected' });
            }
            const profile = await Profile.findOne({ id: req.params.id }).lean();
            if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });
            return res.status(200).json({ status: 'success', data: profile });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', message: 'Internal server error'});
        }
    })();
};

/**
 * DELETE /api/profiles/:id
 */
exports.deleteProfile = (req, res) => {
    (async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ status: 'error', message: 'Database not connected' });
            }
            const result = await Profile.deleteOne({ id: req.params.id });
            if (!result || result.deletedCount === 0) return res.status(404).json({ status: 'error', message: 'Profile not found' });
            return res.status(204).send();
        } catch (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    })();
};

exports.deleteProfileById = (req, res) => {
    (async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ status: 'error', message: 'Database not connected' });
            }
            const id = req.params.id || req.body.id;
            if (!id) return res.status(400).json({ status: 'error', message: 'Missing id' });

            const deleted = await Profile.findOneAndDelete({ id });
            if (!deleted) return res.status(404).json({ status: 'error', message: 'Profile not found' });

            return res.status(200).json({ status: 'success', data: deleted.toObject() });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    })();
}

// exported via `exports.*` above