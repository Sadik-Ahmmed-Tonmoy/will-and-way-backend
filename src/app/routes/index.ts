import { WillRoutes } from './../modules/will/will.route';
import { AssetRoutes } from './../modules/assetManagement/asset.route';
import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { ChatRoutes } from '../modules/chat/chat.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { ProfileRoutes } from '../modules/User/user.routes';
import { GiftRoutes } from '../modules/gift/gift.routes';

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
    path: '/reviews',
    route: ReviewRoutes,
  },

 
  {
    path: '/subscription',
    route: SubscriptionRoutes,
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
  


];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
