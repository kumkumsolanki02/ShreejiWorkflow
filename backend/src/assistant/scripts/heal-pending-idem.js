require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const col = mongoose.connection.db.collection('assistantpendingactions');
  try {
    await col.dropIndex('idempotencyKey_1');
    console.log('dropped index');
  } catch (error) {
    console.log('drop', error.message);
  }
  const broken = await col.find({
    $or: [{ idempotencyKey: null }, { idempotencyKey: { $exists: false } }],
  }).toArray();
  for (const doc of broken) {
    await col.updateOne(
      { _id: doc._id },
      { $set: { idempotencyKey: `legacy:${doc._id}` } },
    );
  }
  console.log('healed', broken.length);
  await col.createIndex(
    { idempotencyKey: 1 },
    { unique: true, sparse: true, name: 'idempotencyKey_1' },
  );
  console.log('recreated sparse unique');
  const id = new mongoose.Types.ObjectId();
  await col.insertOne({
    sessionId: id,
    adminId: id,
    toolName: 'test',
    summary: 't',
    payload: {},
    status: 'cancelled',
    idempotencyKey: `test-${Date.now()}`,
    expiresAt: new Date(Date.now() + 1000),
  });
  console.log('insert ok');
  await col.deleteMany({ toolName: 'test' });
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
