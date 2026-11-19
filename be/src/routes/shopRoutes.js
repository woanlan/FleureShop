/**
 * ============================================================================
 * FILE: src/routes/shopRoutes.js
 * VAI TRÒ TRONG KIẾN TRÚC MVC: Tầng Định tuyến API (`Route`).
 * Làm bản đồ ánh xạ từng đường dẫn URL + phương thức HTTP (GET / POST) sang đúng hàm
 * xử lý nghiệp vụ tương ứng ở tầng `Controller`. Được gắn vào tiền tố `/api` ở `app.js`.
 * ============================================================================
 */

import { Router } from 'express';
import { getBanners } from '../controllers/bannerController.js';
import { getCategories, getCategoryDetail } from '../controllers/categoryController.js';
import { getExperienceDetail, getExperiences } from '../controllers/experienceController.js';
import { getHealth, getHomeData } from '../controllers/homeController.js';
import { createOrder, getOrders } from '../controllers/orderController.js';
import { getPostDetail, getPosts } from '../controllers/postController.js';
import { getProductDetail, getProducts } from '../controllers/productController.js';

// Khởi tạo bộ định tuyến Express Router cho toàn bộ phân hệ cửa hàng hoa FLEURÉ
export const shopRouter = Router();

// --- Nhóm API Kiểm tra hệ thống & Trang chủ tổng hợp ---
shopRouter.get('/health', getHealth); // Kiểm tra tình trạng kết nối MongoDB và số lượng bản ghi 6 bảng
shopRouter.get('/home', getHomeData); // Trả về trọn gói 6 khối dữ liệu cho Trang chủ chỉ trong 1 lần gọi

// --- Nhóm API Danh mục hoa (Categories) ---
shopRouter.get('/categories', getCategories); // Lấy toàn bộ danh mục hoa sắp xếp theo thứ tự hiển thị
shopRouter.get('/categories/:slugOrId', getCategoryDetail); // Xem chi tiết 1 danh mục theo slug SEO hoặc id số

// --- Nhóm API Banner trình chiếu đầu trang (Hero Banners) ---
shopRouter.get('/banners', getBanners); // Lấy danh sách banner đang bật (isActive: true)

// --- Nhóm API Sản phẩm hoa tươi (Products) ---
shopRouter.get('/products', getProducts); // Lọc theo danh mục, tìm kiếm từ khóa, sắp xếp giá & giới hạn số lượng
shopRouter.get('/products/:slugOrId', getProductDetail); // Lấy chi tiết 1 bó hoa theo đường dẫn slug hoặc id

// --- Nhóm API Bài viết cẩm nang & Blog hoa (Posts) ---
shopRouter.get('/posts', getPosts); // Lấy danh sách bài viết mới nhất (hỗ trợ lọc theo chủ đề)
shopRouter.get('/posts/:slugOrId', getPostDetail); // Đọc nội dung chi tiết 1 bài viết theo slug hoặc id

// --- Nhóm API Video trải nghiệm & Workshop cắm hoa (Experiences) ---
shopRouter.get('/experiences', getExperiences); // Lấy danh sách video hướng dẫn bó hoa / chăm hoa
shopRouter.get('/experiences/:slugOrId', getExperienceDetail); // Xem chi tiết 1 video trải nghiệm theo slug hoặc id

// --- Nhóm API Đơn đặt hoa & Thanh toán (Orders) ---
shopRouter.get('/orders', getOrders); // Lấy danh sách 20 đơn hàng gần nhất phục vụ đối soát
shopRouter.post('/orders', createOrder); // Tạo đơn đặt hoa mới (xác thực lại giá gốc từ DB & tính mã giảm giá)
