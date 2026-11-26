const path = require('path');
// Load backend/.env even when PM2 cwd is the repo root.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');
const { ensureDefaultMasterData } = require('./services/masterDataService');
const { getJwtSecret } = require('./services/authService');

try {
  getJwtSecret();
} catch {
  console.error('JWT_SECRET is missing, shorter than 32 characters, or still the example value. Set a random secret in backend/.env.');
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;
const app = createApp();

function listen() {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

connectDatabase()
  .then(async (connected) => {
    if (!connected) {
      console.warn('MONGODB_URI is not configured; authentication routes are unavailable.');
    } else {
      await ensureDefaultMasterData().catch((error) => {
        console.error(`Default master data could not be created: ${error.message}`);
      });
    }
    listen();
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    listen();
  });