// server.js
const express = require('express');
const dotenv = require('dotenv');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Node API is running'));

// Register AI route
app.use('/api/ai', aiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
