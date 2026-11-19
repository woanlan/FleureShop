import { Router } from 'express';
import { getBanners } from '../controllers/bannerController.js';
import { getCategories, getCategoryDetail } from '../controllers/categoryController.js';
import { getExperienceDetail, getExperiences } from '../controllers/experienceController.js';
import { getHealth, getHomeData } from '../controllers/homeController.js';
import { createOrder, getOrders } from '../controllers/orderController.js';
import { getPostDetail, getPosts } from '../controllers/postController.js';
import { getProductDetail, getProducts } from '../controllers/productController.js';

export const shopRouter = Router();

shopRouter.get('/health', getHealth);
shopRouter.get('/home', getHomeData);

shopRouter.get('/categories', getCategories);
shopRouter.get('/categories/:slugOrId', getCategoryDetail);

shopRouter.get('/banners', getBanners);

shopRouter.get('/products', getProducts);
shopRouter.get('/products/:slugOrId', getProductDetail);

shopRouter.get('/posts', getPosts);
shopRouter.get('/posts/:slugOrId', getPostDetail);

shopRouter.get('/experiences', getExperiences);
shopRouter.get('/experiences/:slugOrId', getExperienceDetail);

shopRouter.get('/orders', getOrders);
shopRouter.post('/orders', createOrder);
