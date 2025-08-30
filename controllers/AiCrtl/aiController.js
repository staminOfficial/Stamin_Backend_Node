// controllers/aiController.js
const axios = require('axios');
require('dotenv').config();

exports.getPrediction = async (req, res) => {
  try {
    const response = await axios.post(`${process.env.ML_API_URL}/predict`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error communicating with ML API:', error.message);
    res.status(500).json({ error: 'Failed to get prediction from ML API' });
  }
};
