import mongoose from 'mongoose';
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri)
    throw new Error(
      'MONGODB_URI is required. Copy server/.env.example to server/.env, or run npm run demo.',
    );
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid')
    throw new Error(
      'MongoDB must run as a replica set for atomic inventory transactions. See README.',
    );
}
