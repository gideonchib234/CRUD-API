const express = require('express');
const router = express.Router();
const controller = require('../controller/user-controller');

router.post('/profiles', controller.createProfile);
router.get('/profiles', controller.getAllProfiles);
router.get('/profiles/:id', controller.getProfileById);
router.delete('/profiles/:id', controller.deleteProfile);

module.exports = router;
