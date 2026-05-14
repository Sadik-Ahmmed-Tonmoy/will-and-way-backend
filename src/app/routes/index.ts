import { WillRoutes } from './../modules/will/will.route';
import { AssetRoutes } from './../modules/assetManagement/asset.route';
import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { ChatRoutes } from '../modules/chat/chat.routes';
import { ProfileRoutes } from '../modules/User/user.routes';
import { GiftRoutes } from '../modules/gift/gift.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/profile',
    route: ProfileRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/gifts',
    route: GiftRoutes,
  },
 
  {
    path: '/assets',
    route: AssetRoutes,
  },
 
  {
    path: '/will',
    route: WillRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  


];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
