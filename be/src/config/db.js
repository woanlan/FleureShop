import mongoose from 'mongoose';

export const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/fleure_shop';

/** Connects Mongoose to the configured MongoDB database. */
export async function connectDb(uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

/** Cleanly closes the active Mongoose connection if open. */
export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
