const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/predict', aiController.getPrediction);

module.exports = router;
