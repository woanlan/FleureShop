import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { seedDatabase } from '../src/seed.js';
import { createApp } from '../src/app.js';
import { OrderModel } from '../src/models/Order.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/fleure_shop_test';

describe('FLEURE MVC MongoDB REST API', () => {
  let server;
  let baseUrl = '';

  before(async () => {
    await connectDb(TEST_DB_URI);
    await mongoose.connection.dropDatabase();
    await seedDatabase(TEST_DB_URI);

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.dropDatabase();
    await disconnectDb();
  });

  it('serves health check with counts across all seeded collections', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.counts.categories, 5);
    assert.equal(body.counts.banners, 3);
    assert.equal(body.counts.products, 12);
    assert.equal(body.counts.posts, 6);
    assert.equal(body.counts.experiences, 4);
  });

  it('serves GET /api/home with 3 newest banners, product sections, and 3 posts', async () => {
    const res = await fetch(`${baseUrl}/home`);
    assert.equal(res.status, 200);
    const home = await res.json();
    assert.equal(home.banners.length, 3);
    assert.equal(home.categories.length, 5);
    assert.equal(home.newProducts.length, 4);
    assert.equal(home.bestSellingProducts.length, 4);
    assert.equal(home.saleProducts.length, 4);
    assert.equal(home.latestPosts.length, 3);
    assert.ok(home.banners[0].slug);
    assert.ok(home.newProducts[0].slug);
  });

  it('lists categories, banners, products, posts, experiences with SEO slugs', async () => {
    const [catRes, bannerRes, prodRes, postRes, expRes] = await Promise.all([
      fetch(`${baseUrl}/categories`),
      fetch(`${baseUrl}/banners?limit=3`),
      fetch(`${baseUrl}/products`),
      fetch(`${baseUrl}/posts`),
      fetch(`${baseUrl}/experiences`),
    ]);

    assert.equal(catRes.status, 200);
    assert.equal(bannerRes.status, 200);
    assert.equal(prodRes.status, 200);
    assert.equal(postRes.status, 200);
    assert.equal(expRes.status, 200);

    const [cats, banners, products, posts, experiences] = await Promise.all([
      catRes.json(),
      bannerRes.json(),
      prodRes.json(),
      postRes.json(),
      expRes.json(),
    ]);

    assert.equal(cats.length, 5);
    assert.equal(cats[0].slug, 'hoa-sinh-nhat');
    assert.equal(banners.length, 3);
    assert.equal(products.length, 12);
    assert.ok(products.every((p) => typeof p.slug === 'string' && p.slug.length > 0));
    assert.ok(posts.every((p) => typeof p.slug === 'string' && p.slug.length > 0));
    assert.ok(experiences.every((e) => typeof e.slug === 'string' && e.slug.length > 0));
  });

  it('filters products by categorySlug and ?search= query', async () => {
    const catRes = await fetch(`${baseUrl}/products?categorySlug=hoa-tinh-yeu`);
    assert.equal(catRes.status, 200);
    const catItems = await catRes.json();
    assert.ok(catItems.length > 0);
    assert.ok(catItems.every((p) => p.categorySlug === 'hoa-tinh-yeu'));

    const searchRes = await fetch(`${baseUrl}/products?search=${encodeURIComponent('Tulip')}`);
    assert.equal(searchRes.status, 200);
    const searchItems = await searchRes.json();
    assert.ok(searchItems.length >= 2);
    assert.ok(
      searchItems.every((p) =>
        `${p.name} ${p.description} ${p.category}`.toLowerCase().includes('tulip')
      )
    );
  });

  it('fetches product and post by SEO slug or numeric id and returns 404 when missing', async () => {
    const bySlug = await fetch(`${baseUrl}/products/bo-hoa-diu-ngot-pastel-fleure`);
    assert.equal(bySlug.status, 200);
    const prod = await bySlug.json();
    assert.equal(prod.id, 12);

    const byId = await fetch(`${baseUrl}/products/1`);
    assert.equal(byId.status, 200);
    assert.equal((await byId.json()).id, 1);

    const missing = await fetch(`${baseUrl}/products/khong-ton-tai-999`);
    assert.equal(missing.status, 404);

    const postBySlug = await fetch(
      `${baseUrl}/posts/5-bi-quyet-giu-hoa-tuoi-lau-gap-doi-ngay-nang-nong`
    );
    assert.equal(postBySlug.status, 200);
    assert.equal((await postBySlug.json()).id, 1);
  });

  it('creates verified orders in MongoDB with slug and server-side totals', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Nguyễn Minh Thư',
          phone: '0909123456',
          address: '45 Nguyễn Huệ, Quận 1, TP.HCM',
          note: 'Giao trước 17h',
        },
        items: [{ productId: 12, quantity: 2 }],
        voucherCode: 'FLEURE20',
      }),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.match(created.orderCode, /^FL-\d{6}$/);
    assert.equal(created.slug, created.orderCode.toLowerCase());
    assert.equal(created.subtotal, 780000);
    assert.equal(created.discountAmount, 156000);
    assert.equal(created.shippingFee, 0);
    assert.equal(created.grandTotal, 624000);

    const savedInDb = await OrderModel.findOne({ orderCode: created.orderCode }).lean();
    assert.ok(savedInDb);
    assert.equal(savedInDb.items[0].name, 'Bó Hoa Dịu Ngọt Pastel FLEURÉ');
  });

  it('rejects orders with missing customer details or empty items', async () => {
    const missingCustomer = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { fullName: '', phone: '', address: '' },
        items: [{ productId: 12, quantity: 1 }],
      }),
    });
    assert.equal(missingCustomer.status, 400);

    const emptyCart = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Test User',
          phone: '0909000111',
          address: 'TP.HCM',
        },
        items: [],
      }),
    });
    assert.equal(emptyCart.status, 400);
  });
});
