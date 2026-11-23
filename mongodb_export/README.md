# Funfinder MongoDB Export

This directory contains the complete data exported from Funfinder (`https://funfinder.ge`), formatted and ready for import into MongoDB.

## Exported Files

| File | Documents | Target Collection | Description |
|---|---|---|---|
| `events.json` | 71 | `events` | All activities & tours with full details, primary images, image galleries, pricing, and locations. |
| `categories.json` | 20 | `categories` | Activity categories (Water, Land, Extreme, etc.) |
| `cities.json` | 7 | `cities` | Cities across Georgia (Tbilisi, Batumi, Gudauri, etc.) |
| `sliders.json` | 4 | `sliders` | Homepage promotional slider banners |
| `funfinder_full_database.json` | Full Database | N/A | Single combined JSON file containing all collections. |

---

## How to Import into MongoDB

### Option 1: Using `mongoimport` CLI (Recommended)

Run the following commands in this directory:

```bash
# 1. Import Events
mongoimport --db funfinder --collection events --file events.json --jsonArray --drop

# 2. Import Categories
mongoimport --db funfinder --collection categories --file categories.json --jsonArray --drop

# 3. Import Cities
mongoimport --db funfinder --collection cities --file cities.json --jsonArray --drop

# 4. Import Sliders
mongoimport --db funfinder --collection sliders --file sliders.json --jsonArray --drop
```

> **Note:** If importing into **MongoDB Atlas** (Cloud), append your connection string:
> ```bash
> mongoimport --uri "mongodb+srv://<username>:<password>@cluster0.mongodb.net/funfinder" --collection events --file events.json --jsonArray
> ```

---

### Option 2: Using MongoDB Compass (GUI)

1. Open **MongoDB Compass** and connect to your database.
2. Create or select the database `funfinder`.
3. Create a collection (e.g., `events`).
4. Click **Add Data** -> **Import JSON or CSV**.
5. Select `events.json` (JSON format).
6. Repeat for `categories.json`, `cities.json`, and `sliders.json`.

---

### Option 3: Using Node.js / Mongoose Script

```javascript
const mongoose = require('mongoose');
const events = require('./events.json');

async function importData() {
  await mongoose.connect('mongodb://localhost:27017/funfinder');
  const EventModel = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
  await EventModel.deleteMany({});
  await EventModel.insertMany(events);
  console.log('Events imported successfully!');
  process.exit(0);
}
importData();
```
