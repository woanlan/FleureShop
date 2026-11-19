import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },
  {
    path: 'products',
    loadComponent: () => import('./components/products/products').then((m) => m.Products),
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./components/products/products').then((m) => m.Products),
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./components/product/product').then((m) => m.Product),
  },
  {
    path: 'promotions',
    loadComponent: () => import('./components/promotions/promotions').then((m) => m.Promotions),
  },
  {
    path: 'bai_viet',
    loadComponent: () => import('./components/posts/posts').then((m) => m.Posts),
  },
  {
    path: 'posts',
    redirectTo: 'bai_viet',
    pathMatch: 'full',
  },
  {
    path: 'experience',
    loadComponent: () => import('./components/experience/experience').then((m) => m.Experience),
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
