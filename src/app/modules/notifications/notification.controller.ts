// import { Request, Response } from "express";
// import { notificationServices } from "./notification.service";
// import sendResponse from "../../../shared/sendResponse";
// import catchAsync from "../../utils/catchAsync";

// const sendNotification = catchAsync(async (req: Request, res: Response) => {
//   const notification = await notificationServices.sendSingleNotification(req.user.id, req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Notification sent successfully",
//     data: notification,
//   });
// });

// const sendNotifications = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const payload = req.body;
//   const notifications = await notificationServices.sendNotifications(userId, payload);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Notifications sent successfully",
//     data: notifications,
//   });
// });

// const getNotifications = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const options = req.query;
//   const notifications = await notificationServices.getNotificationsFromDB(userId, options);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Notifications retrieved successfully",
//     data: notifications,
//   });
// });

// const getSingleNotificationById = catchAsync(async (req: Request, res: Response) => {
//   const notificationId = req.params.notificationId;
//   const notification = await notificationServices.getSingleNotificationFromDB(req, notificationId);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Notification retrieved successfully",
//     data: notification,
//   });
// });

// const deleteNotification = catchAsync(async (req: Request, res: Response) => {
//   const notificationId = req.params.notificationId;
//   const userId = req.user.id;
//   const result = await notificationServices.deleteNotification(notificationId, userId);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Notification deleted successfully",
//     data: result,
//   });
// });

// export const notificationController = {
//   sendNotification,
//   sendNotifications,
//   getNotifications,
//   getSingleNotificationById,
//   deleteNotification,
// };
