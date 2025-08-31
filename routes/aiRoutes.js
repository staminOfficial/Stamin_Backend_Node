const express = require('express');
const router = express.Router();
const aiController = require('../controllers/AiCrtl/aiController');

router.post('/predict', aiController.getPrediction);

module.exports = router;
