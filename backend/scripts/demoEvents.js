/**
 * demoEvents.js
 * Seed script to generate realistic event data for testing and demo.
 * 
 * Generates:
 *   - 20 ENTRY events
 *   - 15 EXIT events
 *   - 10 DWELL_TIME events
 *   - 5 QUEUE_ALERT events
 * 
 * All with:
 *   - Valid camera IDs (CAM1–CAM5)
 *   - Timestamps from last 24 hours
 *   - Realistic payloads and metadata
 * 
 * Usage: node scripts/demoEvents.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import Event model
const Event = require('../src/models/Event');

const CAMERAS = ['CAM1', 'CAM2', 'CAM3', 'CAM4', 'CAM5'];
const ZONES = ['aisle', 'shelf', 'checkout', 'entrance', 'exit'];

/**
 * Generate a random timestamp within the last 24 hours
 */
function getRandomTimestampLast24h() {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * oneDayMs;
  return new Date(now.getTime() - randomMs);
}

/**
 * Generate a random camera ID
 */
function getRandomCamera() {
  return CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
}

/**
 * Generate random bounding box [x1, y1, x2, y2] normalized to [0, 1]
 */
function getRandomBbox() {
  const x1 = Math.random() * 0.5;
  const y1 = Math.random() * 0.5;
  const x2 = x1 + Math.random() * 0.5;
  const y2 = y1 + Math.random() * 0.5;
  return [x1, y1, x2, y2];
}

/**
 * Generate ENTRY events
 */
function generateEntryEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      event_type: 'ENTRY',
      camera_id: getRandomCamera(),
      timestamp: getRandomTimestampLast24h(),
      person: {
        track_id: Math.floor(Math.random() * 10000),
        bbox: getRandomBbox(),
        confidence: 0.85 + Math.random() * 0.15,
      },
      store_snapshot: {
        total_occupancy: Math.floor(Math.random() * 100),
        active_cameras: 5,
      },
      ai_meta: {
        model_version: 'yolov8n',
        inference_ms: Math.floor(Math.random() * 50) + 10,
        frame_index: Math.floor(Math.random() * 10000),
      },
      is_alert: false,
      acknowledged: false,
    });
  }
  return events;
}

/**
 * Generate EXIT events
 */
function generateExitEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      event_type: 'EXIT',
      camera_id: getRandomCamera(),
      timestamp: getRandomTimestampLast24h(),
      person: {
        track_id: Math.floor(Math.random() * 10000),
        bbox: getRandomBbox(),
        confidence: 0.80 + Math.random() * 0.20,
      },
      store_snapshot: {
        total_occupancy: Math.floor(Math.random() * 100),
        active_cameras: 5,
      },
      ai_meta: {
        model_version: 'yolov8n',
        inference_ms: Math.floor(Math.random() * 50) + 10,
        frame_index: Math.floor(Math.random() * 10000),
      },
      is_alert: false,
      acknowledged: false,
    });
  }
  return events;
}

/**
 * Generate DWELL_TIME events
 */
function generateDwellEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      event_type: 'DWELL_TIME',
      camera_id: getRandomCamera(),
      timestamp: getRandomTimestampLast24h(),
      person: {
        track_id: Math.floor(Math.random() * 10000),
        // bbox is optional for DWELL_TIME — omit it to avoid validation issues
      },
      dwell: {
        duration_seconds: Math.floor(Math.random() * 300) + 10, // 10–310 seconds
        zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      },
      ai_meta: {
        model_version: 'yolov8n',
        inference_ms: Math.floor(Math.random() * 50) + 10,
        frame_index: Math.floor(Math.random() * 10000),
      },
      is_alert: false,
      acknowledged: false,
    });
  }
  return events;
}

/**
 * Generate QUEUE_ALERT events
 */
function generateQueueEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const depth = Math.floor(Math.random() * 15) + 5; // 5–20 persons
    events.push({
      event_type: 'QUEUE_ALERT',
      camera_id: getRandomCamera(),
      timestamp: getRandomTimestampLast24h(),
      queue: {
        depth,
        wait_time_estimate_seconds: depth * 45, // ~45s per person heuristic
      },
      is_alert: depth >= 5, // Alert if depth >= 5
      acknowledged: false,
    });
  }
  return events;
}

/**
 * Main seed function
 */
async function seedDemoEvents() {
  // Support multiple MongoDB env var names
  const uriSource = process.env.MONGO_URI ? 'MONGO_URI'
    : process.env.MONGODB_URI ? 'MONGODB_URI'
    : process.env.DATABASE_URL ? 'DATABASE_URL'
    : 'FALLBACK_LOCALHOST';

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/purplle_ai';

  console.log(`📌 MongoDB URI source: ${uriSource}`);
  console.log(`📌 Connecting to MongoDB: ${mongoUri}`);

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    // Extract and print database name
    const dbName = mongoose.connection.name || 'purplle_ai';
    const dbHost = mongoose.connection.host || 'unknown';
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${dbHost}`);

    // Generate all events
    const entryEvents = generateEntryEvents(20);
    const exitEvents = generateExitEvents(15);
    const dwellEvents = generateDwellEvents(10);
    const queueEvents = generateQueueEvents(5);

    const allEvents = [
      ...entryEvents,
      ...exitEvents,
      ...dwellEvents,
      ...queueEvents,
    ];

    console.log(`\n📊 Generated ${allEvents.length} demo events:`);
    console.log(`   • ENTRY:      20 events`);
    console.log(`   • EXIT:       15 events`);
    console.log(`   • DWELL_TIME: 10 events`);
    console.log(`   • QUEUE_ALERT: 5 events`);

    // Insert events into database
    console.log(`\n⏳ Inserting events into database...`);
    const inserted = await Event.insertMany(allEvents);
    console.log(`✅ Successfully inserted ${inserted.length} events`);

    // Verify insertion by checking each event type
    console.log(`\n🔍 Verifying insertion...`);
    const entryCount = await Event.countDocuments({ event_type: 'ENTRY' });
    const exitCount = await Event.countDocuments({ event_type: 'EXIT' });
    const dwellCount = await Event.countDocuments({ event_type: 'DWELL_TIME' });
    const queueCount = await Event.countDocuments({ event_type: 'QUEUE_ALERT' });
    const totalCount = await Event.countDocuments({});

    console.log(`   ENTRY: ${entryCount} (expected: 20)`);
    console.log(`   EXIT: ${exitCount} (expected: 15)`);
    console.log(`   DWELL_TIME: ${dwellCount} (expected: 10)`);
    console.log(`   QUEUE_ALERT: ${queueCount} (expected: 5)`);
    console.log(`   TOTAL: ${totalCount} (expected: 50)`);

    if (totalCount === 50) {
      console.log(`\n✅ All 50 events inserted successfully!`);
    }

    // Print sample event
    console.log(`\n📋 Sample event (first ENTRY):`);
    console.log(JSON.stringify(entryEvents[0], null, 2));

    console.log(`\n✨ Demo events seeded successfully!`);
  } catch (err) {
    console.error(`❌ Error during seeding: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log(`\n🔌 Disconnected from MongoDB`);
    process.exit(0);
  }
}

// Run seeding
seedDemoEvents();
