// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { ObjectId } from "mongodb";
// import WebSocket from "ws";
// import { activeUsers, chatRooms } from "./socket";
// import prisma from "../../shared/ommitedPrisma";

// /**
//  * NOTE: If you already have named exports with these names in another module,
//  * remove the duplicates or rename them to avoid `Cannot redeclare exported variable`.
//  */

// export interface ExtendedWebSocket extends WebSocket {
//   userId?: string;
//   user2Id?: string;
//   chatroomId?: string;
//   groupId?: string;
// }

// export enum MessageTypes {
//   JOIN_PRIVATE_CHAT = "joinPrivateChat",
//   SEND_PRIVATE_MESSAGE = "sendPrivateMessage",
//   RECEIVED_PRIVATE_MESSAGE = "receivePrivateMessage",
//   CONVERSATION_LIST = "conversationList",
//   JOIN_CONVERSATION_LIST = "joinConversationList",
//   AUTH_SUCCESS = "authSuccess",
//   AUTH_FAILURE = "authFailure",
//   FAILURE = "Failure",
//   JOIN_APP = "joinApp",
//   JOIN_GROUP = "joinGroup",
//   SEND_GROUP_MESSAGE = "sendGroupMessage",
//   RECEIVED_GROUP_MESSAGE = "receiveGroupMessage",
// }

// /* small in-memory buffer to mimic previous behaviour */
// const MAX_IN_MEMORY_MESSAGES = 5;
// const inMemoryMessages: Map<string, Array<any>> = new Map();

// /* ---------- Helpers ---------- */

// /**
//  * activeUsers map may store either:
//  * - ExtendedWebSocket directly
//  * - or { socket: ExtendedWebSocket, lastActiveAt: Date | null }
//  * This helper returns the socket or null.
//  */
// function getSocketFromActiveUsers(userId: string): ExtendedWebSocket | null {
//   const entry = (activeUsers as any).get?.(userId);
//   if (!entry) return null;
//   // entry can be the socket itself or an object { socket, lastActiveAt }
//   if ((entry as any).socket) return (entry as any).socket as ExtendedWebSocket;
//   return (entry as ExtendedWebSocket) ?? null;
// }

// /* Build a small user object for realtime payloads. Some schemas don't have `username` or `image`. */
// async function getUserDetailsFromDB(userId: string) {
//   try {
//     // Select only fields that exist on your User model.
//     // Adjust `select` below if your schema exposes different fields.
//     const user = await (prisma.user as any).findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         // If you actually have username/image fields, add them here.
//         // username: true,
//         // image: true,
//       },
//     });

//     if (!user) return { id: userId, username: null, image: null };

//     const username =
//       (user as any).username ??
//       (user.email ? (user.email as string).split("@")[0] : null);

//     const image = (user as any).image ?? null;

//     return {
//       id: user.id,
//       username,
//       image,
//       raw: user,
//     };
//   } catch (err) {
//     console.error("getUserDetailsFromDB error:", err);
//     return { id: userId, username: null, image: null };
//   }
// }

// /* Fetch conversation record — adapt field list to your schema */
// async function getConversationFromDB(conversationId: string) {
//   try {
//     // If your Prisma model is named `Conversation`, use (prisma as any).conversation
//     // If it's `conversations` or something else, change accordingly.
//     return await (prisma as any).conversation?.findUnique?.({
//       where: { id: conversationId },
//       select: {
//         id: true,
//         lastMessage: true,
//         updatedAt: true,
//         status: true,
//       },
//     });
//   } catch (err) {
//     console.error("getConversationFromDB error:", err);
//     return null;
//   }
// }

// /* Persist batch to DB — remove skipDuplicates if your Prisma types don't accept it */
// async function persistMessagesToDB(conversationId: string, messages: any[]) {
//   if (!messages?.length) return;
//   try {
//     const createManyPayload = messages.map((m) => ({
//       id: m.id,
//       senderId: m.senderId,
//       receiverId: m.receiverId,
//       content: m.content ?? null,
//       // TODO: if your Message model uses a different field name for images, change below:
//       // e.g., image -> imagePath or mediaUrl etc.
//       imageUrl: m.imageUrl ?? null,
//       conversationId: conversationId,
//       read: m.read ?? false,
//       createdAt: new Date(m.createdAt),
//       updatedAt: new Date(m.updatedAt),
//     }));

//     // If `skipDuplicates` is not accepted by your Prisma version/type, remove it.
//     // I cast to any to avoid the `skipDuplicates: never` typing problem.
//     await prisma.privateMessage.createMany({
//       data: createManyPayload,
//       // skipDuplicates: true, // <- remove or keep based on your Prisma version
//     });
//   } catch (error) {
//     console.error("persistMessagesToDB failed:", error);
//   }
// }

// /* ---------- Core exported functions ---------- */

// /* Note: export as const to avoid duplicate-declaration issues when the file is imported multiple times */
// export const handleConversationJoinEvent = async (
//   ws: ExtendedWebSocket,
//   userId: string,
//   activeUsersMap: Map<string, any>
// ) => {
//   ws.userId = userId;
//   // Accept both shapes for activeUsers map
//   try {
//     // If activeUsers holds { socket, lastActiveAt }, store that; else store socket
//     const existing = (activeUsersMap as any).get?.(userId);
//     if (existing && (existing as any).socket) {
//       // keep existing shape
//       (activeUsersMap as any).set(userId, {
//         socket: ws,
//         lastActiveAt: new Date(),
//       });
//     } else {
//       (activeUsersMap as any).set(userId, {
//         socket: ws,
//         lastActiveAt: new Date(),
//       });
//     }
//   } catch {
//     (activeUsersMap as any).set(userId, ws);
//   }

//   ws.send(
//     JSON.stringify({
//       type: MessageTypes.JOIN_CONVERSATION_LIST,
//       message: `Successfully joined`,
//     })
//   );
// };

// export const storeAndSendPrivateMessage = async (
//   ws: ExtendedWebSocket,
//   senderId: string,
//   receiverId: string,
//   content: string,
//   imageUrl: string,
//   conversationId: string
// ) => {
//   try {
//     const timestamp = new Date().toISOString();

//     const [senderDetails, receiverDetails] = await Promise.all([
//       getUserDetailsFromDB(senderId),
//       getUserDetailsFromDB(receiverId),
//     ]);
 
//     const messagePayload = {
//       id: new ObjectId().toString(),
//       senderId,
//       receiverId,
//       content,
//       // note: if your Message model does not have `imageUrl`, rename below.
//       imageUrl,
//       createdAt: timestamp,
//       read: false,
//       updatedAt: timestamp,
//       conversationId,
//     };

//     // Realtime delivery to sockets in chatRoom
//     const chatRoom =
//       (chatRooms as any).get?.(conversationId) ?? chatRooms.get(conversationId);
//     if (chatRoom) {
//       for (const clientSocket of chatRoom as Set<ExtendedWebSocket>) {
//         if (clientSocket.readyState === WebSocket.OPEN) {
//           const isSender = clientSocket.userId === senderId;
//           clientSocket.send(
//             JSON.stringify({
//               ...messagePayload,
//               type: MessageTypes.RECEIVED_PRIVATE_MESSAGE,
//               receiver: isSender ? receiverDetails : senderDetails,
//             })
//           );
//         }
//       }
//     }

//     // Buffer in memory
//     const existing = inMemoryMessages.get(conversationId) ?? [];
//     existing.push({ ...messagePayload });
//     inMemoryMessages.set(conversationId, existing);

//     try {
//       await prisma.privateMessage.create({
//         data: {
//           id: messagePayload.id,
//           senderId: messagePayload.senderId,
//           receiverId: messagePayload.receiverId,
//           content: messagePayload.content ?? null,
//           imageUrl: messagePayload.imageUrl ?? null,
//           conversationId: messagePayload.conversationId,
//           read: false,
//           createdAt: new Date(messagePayload.createdAt),
//           updatedAt: new Date(messagePayload.updatedAt),
//         },
//       });
//     } catch (err) {
//       console.error(
//         "Single message create failed (will rely on batch persist):",
//         err
//       );
//     }

//     // Batch persist if buffer threshold reached
//     const buffer = inMemoryMessages.get(conversationId) ?? [];
//     if (buffer.length >= MAX_IN_MEMORY_MESSAGES) {
//       // clear buffer and persist async
//       inMemoryMessages.set(conversationId, []);
//       setImmediate(async () => {
//         try {
//           await persistMessagesToDB(conversationId, buffer);
//         } catch (err) {
//           console.error("persistMessagesToDB error:", err);
//         }
//       });
//     }

//     // Update conversation meta in DB — use (prisma as any) if property isn't recognized
//     try {
//       await prisma.conversation?.update?.({
//         where: { id: conversationId },
//         data: {
//           lastMessage: content ? content : imageUrl,
//           status: "ACTIVE",
//           updatedAt: new Date(),
//         },
//       });
//     } catch (err) {
//       console.error("conversation.update failed:", err);
//     }

//     // If receiver offline, send notification
//     const receiverSocket = getSocketFromActiveUsers(receiverId);
//     if (!receiverSocket || receiverSocket.readyState !== WebSocket.OPEN) {
//       try {
//         // Use your notification service if available.
//         // This stays as-is; if you access it from global or import, use that reference.
//         await (global as any).notificationServices?.sendSingleNotification?.({
//           id: receiverId,
//           body: `${
//             (senderDetails as any).username ??
//             (senderDetails as any).email ??
//             "Someone"
//           } send you a message`,
//           title: (senderDetails as any).image ?? null,
//         });
//       } catch (notifErr) {
//         console.error("notification send failed:", notifErr);
//       }
//     }

//     // Send updated conversation payload to both parties by reading from DB
//     const updatedConversation = await getConversationFromDB(conversationId);
//     [senderId, receiverId].forEach((userId) => {
//       const sock = getSocketFromActiveUsers(userId);
//       if (sock && sock.readyState === WebSocket.OPEN) {
//         sock.send(
//           JSON.stringify({
//             type: MessageTypes.CONVERSATION_LIST,
//             result: updatedConversation,
//           })
//         );
//       }
//     });
//   } catch (error: any) {
//     ws.send(
//       JSON.stringify({
//         type: MessageTypes.FAILURE,
//         message: `Message sending failed: ${error?.message || error}`,
//       })
//     );
//   }
// };

// export function handleDisconnect(ws: ExtendedWebSocket) {
//   try {
//     if (ws.userId) {
//       (activeUsers as any).delete?.(ws.userId) ?? activeUsers.delete(ws.userId);
//       // If your socket store used a function to remove a user connection, call that here:
//       // redisSocketService?.removeUserConnection?.(ws.userId);

//       if (ws.chatroomId && chatRooms.has(ws.chatroomId)) {
//         const chatRoom = chatRooms.get(ws.chatroomId);
//         chatRoom?.delete(ws);
//         if (chatRoom && chatRoom.size === 0) {
//           chatRooms.delete(ws.chatroomId);
//         }
//       }
//     }
//   } catch (error) {
//     console.error("handleDisconnect error:", error);
//     return;
//   }
// }

// /* Keep broadcast helper exported if you use it elsewhere */
// export function broadcastToGroup(
//   groupId: string,
//   message: any,
//   groupRooms: Map<string, Set<ExtendedWebSocket>>
// ) {
//   const groupClients = groupRooms.get(groupId);
//   if (!groupClients) return;

//   groupClients.forEach((client: ExtendedWebSocket) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify(message));
//     }
//   });
// }
