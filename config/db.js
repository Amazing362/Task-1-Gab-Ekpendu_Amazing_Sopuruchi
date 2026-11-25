const mongoose = require("mongoose");

function buildMongoUri() {
  const { MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER, MONGO_DB, MONGODB_URI } = process.env;

  if (MONGO_USER && MONGO_PASSWORD && MONGO_CLUSTER) {
    const user = encodeURIComponent(MONGO_USER.trim());
    const pass = encodeURIComponent(MONGO_PASSWORD.trim());
    const dbName = (MONGO_DB || "grace_harbor_church").trim();
    return `mongodb+srv://${user}:${pass}@${MONGO_CLUSTER.trim()}/${dbName}?retryWrites=true&w=majority`;
  }

  return MONGODB_URI;
}

async function connectDB() {
  const uri = buildMongoUri();

  if (!uri || uri.includes("your_mongodb_username") || uri.includes("<username>")) {
    throw new Error(
      "MongoDB credentials are missing or still use placeholders. Check MONGO_USER, MONGO_PASSWORD, and MONGO_CLUSTER in .env."
    );
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  return conn;
}

module.exports = connectDB;
