# FLEURÉ – Flower Boutique (Lab 4 & ASM 1 Full-Stack)

Dự án được tách thành 2 thư mục rõ ràng **Backend (`be/`)** và **Frontend (`fe/`)**, sử dụng cơ sở dữ liệu **MongoDB** (hỗ trợ cả Local `mongodb://127.0.0.1:27017/fleure_shop` và Cloud **MongoDB Atlas**).

## Link Triển Khai Thực Tế (Live Demo)
- **Website Frontend (Vercel):** https://fleure-shop-wcnk.vercel.app/
- **Backend REST API (Render):** https://fleureshop.onrender.com
- **Kiểm tra MongoDB Health Check:** https://fleureshop.onrender.com/api/health
- **GitHub Repository:** https://github.com/woanlan/FleureShop

## Cấu trúc thư mục

```text
asm/
├── be/                     # Node.js + Express + Mongoose (MVC, cổng 5000)
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/    # home, category, banner, product, post, experience, order
│   │   ├── models/         # Category, Banner, Product, Post, Experience, Order (đều có slug)
│   │   ├── routes/         # shopRoutes.js
│   │   ├── data/           # seedData.js (dữ liệu nguồn nạp sang MongoDB)
│   │   ├── utils/          # slugify.js, lookup.js, orderPricing.js
│   │   ├── seed.js
│   │   └── server.js       # Tự auto-seed khi DB trống
│   └── tests/api.test.js
└── fe/                     # Angular 22 Standalone + Signals + HttpClient (cổng 4200)
    ├── proxy.conf.json     # Chuyển tiếp /api -> http://127.0.0.1:5000
    ├── vercel.json         # Cấu hình rewrite SPA khi deploy lên Vercel
    └── src/app/...
```

---

## 1. Hướng dẫn chạy Local (MongoDB đang bật sẵn trên máy)

### Terminal 1 — Backend (`asm/be` • cổng `5000`)
```powershell
cd c:\Users\Admin\Desktop\ANGULAR\asm\be
npm install
npm run seed
npm start
```

### Terminal 2 — Frontend (`asm/fe` • cổng `4200`)
```powershell
cd c:\Users\Admin\Desktop\ANGULAR\asm\fe
npm install
npm start
```
Mở trình duyệt tại `http://localhost:4200`.

---

## 2. Danh sách API Backend (`http://localhost:5000/api`)

| Method | Endpoint | Mô tả | Collection MongoDB |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra kết nối & đếm bản ghi từng bảng | Tất cả 6 collections |
| `GET` | `/api/home` | API Trang chủ (3 banner mới nhất, 5 danh mục, 4 sp mới, 4 bán chạy, 4 khuyến mãi, 3 bài viết) | `banners`, `categories`, `products`, `posts` |
| `GET` | `/api/categories` | Danh sách danh mục hoa (có `slug`, `order`, `icon`) | `categories` |
| `GET` | `/api/categories/:slugOrId` | Chi tiết danh mục theo `slug` hoặc `id` | `categories` |
| `GET` | `/api/banners` | Danh sách banner (hỗ trợ `?limit=3`) | `banners` |
| `GET` | `/api/products` | Lọc theo `?categorySlug=`, tìm kiếm `?search=`, sắp xếp `?sort=`, giới hạn `?limit=` | `products` |
| `GET` | `/api/products/:slugOrId` | Chi tiết sản phẩm theo `slug` hoặc `id` | `products` |
| `GET` | `/api/posts` | Danh sách bài viết Blog (hỗ trợ `?category=`) | `posts` |
| `GET` | `/api/posts/:slugOrId` | Chi tiết bài viết theo `slug` hoặc `id` | `posts` |
| `GET` | `/api/experiences` | Danh sách video trải nghiệm | `experiences` |
| `POST` | `/api/orders` | Kiểm tra giá & mã giảm giá phía server rồi lưu đơn đặt hoa | `orders` |
| `GET` | `/api/orders` | Xem 20 đơn hàng gần nhất | `orders` |

---

## 3. Các Route chính phía Frontend (`asm/fe`)
- `/` — Trang chủ nạp dữ liệu từ `GET /api/home` (3 banner slide + 4 section sản phẩm/bài viết)
- `/products` & `/category/:slug` — Danh sách hoa & lọc danh mục theo SEO slug
- `/product/:slug` — Chi tiết bó hoa theo SEO slug (kèm reset số lượng bằng `linkedSignal`)
- `/bai_viet` — Trang Blog bài viết chăm sóc hoa (`/posts` tự chuyển về `/bai_viet`)
- `/experience` — Gallery video hướng dẫn gói hoa
- `/promotions` — Flash Sale & sản phẩm giảm giá
- `/cart` — Giỏ hàng lưu bền trên `localStorage` (`fleure_asm_cart_v1`) + đặt hàng lưu MongoDB

---

## 4. Triển khai Git, Render & Vercel (mục * của ASM1)
1. **MongoDB Atlas:** Tạo cluster miễn phí M0, bật Network Access `0.0.0.0/0`, lấy Connection String.
2. **Backend lên Render:** Tạo Web Service trỏ `Root Directory` tới `be`, Build Command `npm install`, Start Command `npm start`, thêm biến môi trường `MONGODB_URI` & `CORS_ORIGIN`.
3. **Frontend lên Vercel:** Import repo Git, đặt `Root Directory` là `fe`, Build Command `npm run build`, Output Directory `dist/asm-frontend/browser`, cấu hình proxy/API trỏ tới URL Render (đã có sẵn `fe/vercel.json`).
