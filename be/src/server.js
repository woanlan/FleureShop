import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { ensureSeeded } from './seed.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDb();

  const seeded = await ensureSeeded();
  if (seeded) {
    console.log(
      `Auto-seeded MongoDB: ${seeded.categories} categories, ${seeded.banners} banners, ${seeded.products} products, ${seeded.posts} posts, ${seeded.experiences} experiences.`
    );
  }

  const app = createApp();
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`FLEURE Backend API listening at http://127.0.0.1:${PORT}/api`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start FLEURE Backend:', err);
  process.exit(1);
});
