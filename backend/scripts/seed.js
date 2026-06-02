/**
 * Seed script — run once: node scripts/seed.js
 * Creates camera registry and default occupancy snapshot.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Camera = require('../src/models/Camera');
const OccupancySnapshot = require('../src/models/OccupancySnapshot');

const CAMERAS = [
  { camera_id: 'CAM1', name: 'Browsing Zone A', location: 'Aisle 1-3', role: 'browsing', config: { dwell_zone_enabled: true } },
  { camera_id: 'CAM2', name: 'Browsing Zone B', location: 'Aisle 4-6', role: 'browsing', config: { dwell_zone_enabled: true } },
  { camera_id: 'CAM3', name: 'Main Entrance', location: 'Store entrance/exit', role: 'entry_exit', config: { entry_line_y: 0.5 } },
  { camera_id: 'CAM4', name: 'Billing Counter', location: 'Checkout area', role: 'billing', config: { queue_zone_enabled: true } },
  { camera_id: 'CAM5', name: 'Ops Counter', location: 'Service / Returns', role: 'operations', config: { queue_zone_enabled: true } },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/purplle_ai');
  console.log('Connected to MongoDB');

  for (const cam of CAMERAS) {
    await Camera.findOneAndUpdate({ camera_id: cam.camera_id }, cam, { upsert: true, new: true });
    console.log(`✓ Camera ${cam.camera_id} seeded`);
  }

  await OccupancySnapshot.findOneAndUpdate(
    { store_id: 'main' },
    {
      store_id: 'main',
      current_count: 0,
      threshold: parseInt(process.env.OCCUPANCY_THRESHOLD || '50'),
      today_entries: 0,
      today_exits: 0,
    },
    { upsert: true }
  );
  console.log('✓ Occupancy snapshot seeded');

  await mongoose.disconnect();
  console.log('Done. Run npm run dev to start the backend.');
}

seed().catch(err => { console.error(err); process.exit(1); });
