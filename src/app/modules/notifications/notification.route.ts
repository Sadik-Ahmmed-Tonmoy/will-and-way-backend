// import express from 'express';
// import { notificationController } from './notification.controller';
// import auth from '../../middlewares/auth';
// import validateRequest from "../../middlewares/validateRequest";
// import { NotificationValidation } from "./notification.validation";
 
// const router = express.Router();
 
// router.post(
//   "/send-notification",
//   validateRequest(NotificationValidation.cerateNotification),
//   auth(),
//   notificationController.sendNotification
// );
 
// router.post(
//   "/send-notifications",
//   validateRequest(NotificationValidation.cerateNotification),
//   auth(),
//   notificationController.sendNotifications
// );
 
// router.get('/', auth(), notificationController.getNotifications);
// router.get(
//   '/:notificationId',
//   auth(),
//   notificationController.getSingleNotificationById,
// );
 
// router.delete(
//   '/delete-notification/:notificationId',
//   auth(),
//   notificationController.deleteNotification,
// );
 
// export const NotificationsRouters = router;