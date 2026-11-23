import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const DEFAULT_URI = 'mongodb+srv://kakhiweinrooneykakhidze_db_user:HkeshHOp7ANuiDpL@cluster0.cffsw4o.mongodb.net/?retryWrites=true&w=majority';
let rawUri = process.env.MONGODB_URI;
// Ignore empty or placeholder Vercel-generated empty databases so live data is always used
if (!rawUri || rawUri.includes('atlas-yellow-cloud') || rawUri.includes('qby9nzs')) {
  rawUri = DEFAULT_URI;
}
const uri = rawUri;
const dbName = process.env.MONGODB_DB_NAME || 'funfinder';

let client = null;
let db = null;
let autoSeedChecked = false;

export async function connectDb() {
  if (db) return db;
  try {
    if (!client) {
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
      });
    }
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB database: "${dbName}"`);

    // Auto-seed if database is empty
    if (!autoSeedChecked) {
      autoSeedChecked = true;
      try {
        const eventsCol = db.collection('events');
        const count = await eventsCol.countDocuments();
        if (count === 0) {
          console.log('Database has 0 events. Running auto-seed in background...');
          import('./seed.js').then(({ runSeed }) => runSeed()).catch(e => console.warn('Auto-seed note:', e.message));
        }
      } catch (checkErr) {
        console.warn('Auto-seed check note:', checkErr.message);
      }
    }

    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function getDb() {
  if (!db) {
    return await connectDb();
  }
  return db;
}

export async function getCollection(name) {
  const database = await getDb();
  return database.collection(name);
}

export function toIdFilter(id) {
  if (id === undefined || id === null) return { id: null };
  const num = Number(id);
  if (!isNaN(num)) {
    return {
      $or: [
        { id: num },
        { _id: num },
        { id: String(id) },
        { _id: String(id) }
      ]
    };
  }
  return {
    $or: [
      { id: String(id) },
      { _id: String(id) }
    ]
  };
}

export async function getNextId(collectionName) {
  const col = await getCollection(collectionName);
  const highest = await col.find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  if (highest.length > 0 && typeof highest[0].id === 'number') {
    return highest[0].id + 1;
  }
  const count = await col.countDocuments();
  return count + 1;
}
