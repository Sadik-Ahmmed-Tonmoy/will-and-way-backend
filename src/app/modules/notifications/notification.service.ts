// import httpStatus from "http-status";
// import prisma from "../../../shared/prisma";
// import { IPaginationOptions } from "../../../interfaces/paginations";
// import ApiError from "../../../errors/ApiErrors";
// import admin from "../../firebase/firebaseAdmin";
// import { paginationHelpers } from "../../../helpars/paginationHelper";

// // Send notification to a single user
// const sendSingleNotification = async (senderId: string, payload: any) => {
//   const { receiverId, title, body, type, additionData } = payload;

//   if (!receiverId || !title || !body) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
//   }

//   // Find receiver FCM token
//   const receiver = await prisma.user.findUnique({
//     where: { id: receiverId },
//     select: { fcmToken: true },
//   });

//   // Save notification in DB
//   const notification = await prisma.notifications.create({
//     data: {
//       senderId,
//       receiverId,
//       title,
//       body,
//       type: type || "GENERAL",
//       additionData,
//     },
//   });

//   // Send FCM push
//   if (receiver?.fcmToken) {
//     const message: any = {
//       notification: { title, body },
//       token: receiver.fcmToken,
//       data: additionData ? { additionData: JSON.stringify(additionData) } : {},
//     };

//     try {
//       await admin.messaging().send(message);
//     } catch (error: any) {
//       console.error("❌ FCM send error:", error.message);
//     }
//   }

//   return notification;
// };

// // Send notification to multiple users
// const sendNotifications = async (senderId: string, payload: any) => {
//   const { title, body, type, additionData } = payload;

//   const users = await prisma.user.findMany({
//     where: {
//       id: { not: senderId },
//       // isNotificationOn: true,
//       fcmToken: { not: null },
//     },
//     select: { id: true, fcmToken: true },
//   });

//   if (users.length === 0) return;

//   const notificationData = users.map((u) => ({
//     senderId,
//     receiverId: u.id,
//     title,
//     body,
//     type: type || "GENERAL",
//     additionData,
//   }));

//   await prisma.notifications.createMany({ data: notificationData });

//   const fcmTokens = users.map((u) => u.fcmToken!).filter(Boolean);
//   if (fcmTokens.length === 0) return;

//   const message: any = {
//     notification: { title, body },
//     tokens: fcmTokens,
//     data: additionData ? { additionData: JSON.stringify(additionData) } : {},
//   };

//   const response = await admin.messaging().sendEachForMulticast(message);

//   const failedTokens = response.responses
//     .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
//     .filter(Boolean);

//   if (failedTokens.length > 0) {
//     console.warn("⚠️ Failed FCM tokens:", failedTokens);
//   }

//   return { success: true, sentTo: fcmTokens.length };
// };

// // Fetch paginated notifications
// const getNotificationsFromDB = async (userId: string, options: IPaginationOptions) => {
//   const { page, limit, skip } = paginationHelpers.calculatePagination(options);

//   const [notifications, total] = await Promise.all([
//     prisma.notifications.findMany({
//       where: { receiverId: userId },
//       orderBy: { createdAt: "desc" },
//       skip,
//       take: limit,
//       select: {
//         id: true,
//         title: true,
//         body: true,
//         senderId: true,
//         read: true,
//         additionData: true,
//         createdAt: true,
//         sender: { select: { id: true, email: true } },
//       },
//     }),
//     prisma.notifications.count({ where: { receiverId: userId } }),
//   ]);

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//       totalPage: Math.ceil(total / limit),
//     },
//     data: notifications,
//   };
// };

// // Get a single notification by ID
// const getSingleNotificationFromDB = async (req: any, notificationId: string) => {
//   const userId = req.user.id;

//   const notification = await prisma.notifications.findUnique({
//     where: { id: notificationId },
//     select: {
//       id: true,
//       title: true,
//       body: true,
//       senderId: true,
//       receiverId: true,
//       read: true,
//       createdAt: true,
//       additionData: true,
//       sender: { select: { id: true, email: true } },
//     },
//   });

//   if (!notification) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
//   }

//   if (notification.receiverId !== userId) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
//   }

//   if (!notification.read) {
//     await prisma.notifications.update({
//       where: { id: notificationId },
//       data: { read: true },
//     });
//   }

//   return notification;
// };

// // Delete notification
// const deleteNotification = async (notificationId: string, userId: string) => {
//   const existingNotification = await prisma.notifications.findFirst({
//     where: { id: notificationId, receiverId: userId },
//   });

//   if (!existingNotification) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
//   }

//   await prisma.notifications.delete({ where: { id: notificationId } });

//   return { deleted: true };
// };

// export const notificationServices = {
//   sendSingleNotification,
//   sendNotifications,
//   getNotificationsFromDB,
//   getSingleNotificationFromDB,
//   deleteNotification,
// };
