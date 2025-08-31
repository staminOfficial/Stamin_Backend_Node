// server.js
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require("./db");
const app = require("./app");
// const aiRoutes = require('./routes/aiRoutes');

connectDB();

// Health check
app.get('/', (req, res) => res.send('Node API is running'));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
