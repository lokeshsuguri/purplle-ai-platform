require('dotenv').config();
const mongoose = require('mongoose');
const OccupancySnapshot = require('../src/models/OccupancySnapshot');
const AnalyticsRollup = require('../src/models/AnalyticsRollup');

const BACKFILL_HOURS = 24;

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBucketStart(date) {
  const ts = new Date(date);
  ts.setMinutes(0, 0, 0, 0);
  return ts;
}

function generateHourlyRollups(hours) {
  const now = new Date();
  const rollups = [];
  const baseline = 25;

  for (let i = hours - 1; i >= 0; i -= 1) {
    const bucket_start = getBucketStart(new Date(now.getTime() - i * 3600 * 1000));
    const hour = bucket_start.getHours();
    const multiplier = hour >= 10 && hour <= 20 ? 1.5 : 0.7;
    const entries = Math.max(0, Math.round((Math.sin((hour / 24) * Math.PI) * 10 + 6) * multiplier));
    const exits = Math.max(0, entries - Math.round(Math.random() * 4));
    const peak_occupancy = clamp(Math.max(10, entries * 3 + Math.round(Math.random() * 8)), 10, 55);
    const avg_occupancy = clamp(Math.round(peak_occupancy * 0.7), 5, peak_occupancy);
    const net_footfall = entries - exits;

    rollups.push({
      period: 'hour',
      bucket_start,
      entries,
      exits,
      net_footfall,
      peak_occupancy,
      avg_occupancy,
      total_dwell_events: Math.round(entries * 0.25),
      avg_dwell_seconds: 45 + Math.round(Math.random() * 30),
      avg_queue_depth: Math.round(Math.random() * 4) + 1,
      max_queue_depth: Math.round(Math.random() * 8) + 5,
      queue_alert_count: Math.round(Math.random() * 2),
      crowd_alert_count: 0,
    });
  }

  return rollups;
}

async function seedDashboard() {
  const uri = getMongoUri();
  console.log('Using URI:', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log(`Connected to MongoDB: ${uri}`);

  const rollups = generateHourlyRollups(BACKFILL_HOURS);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0, 0);
  const todayRollups = rollups.filter(r => r.bucket_start >= todayStart);

  const todayEntries = todayRollups.reduce((sum, r) => sum + r.entries, 0);
  const todayExits = todayRollups.reduce((sum, r) => sum + r.exits, 0);
  const peakToday = todayRollups.reduce((best, r) => {
    if (!best || r.peak_occupancy > best.peak_occupancy) return r;
    return best;
  }, null);
  const currentSnapshot = todayRollups[todayRollups.length - 1] || rollups[rollups.length - 1];

  for (const rollup of rollups) {
    await AnalyticsRollup.findOneAndUpdate(
      { period: 'hour', bucket_start: rollup.bucket_start },
      { $set: rollup },
      { upsert: true, new: true }
    );
    console.log(`Seeded rollup ${rollup.bucket_start.toISOString()} -> entries=${rollup.entries}, exits=${rollup.exits}`);
  }

  await OccupancySnapshot.findOneAndUpdate(
    { store_id: 'main' },
    {
      store_id: 'main',
      current_count: currentSnapshot ? clamp(currentSnapshot.peak_occupancy - 5, 0, 50) : 28,
      threshold: parseInt(process.env.OCCUPANCY_THRESHOLD || '50', 10),
      today_entries: todayEntries,
      today_exits: todayExits,
      peak_today: {
        count: peakToday ? peakToday.peak_occupancy : 0,
        at: peakToday ? peakToday.bucket_start : new Date(),
      },
      last_updated: new Date(),
    },
    { upsert: true, new: true }
  );

  console.log(`Seeded occupancy snapshot: entries=${todayEntries}, exits=${todayExits}, peak=${peakToday ? peakToday.peak_occupancy : 0}`);

  await mongoose.disconnect();
  console.log('Dashboard demo data seeded successfully.');
}

seedDashboard().catch(err => {
  console.error('Failed to seed dashboard demo data:', err);
  process.exit(1);
});
