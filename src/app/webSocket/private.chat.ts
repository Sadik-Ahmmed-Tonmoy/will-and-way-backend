

// import prisma from "../../shared/ommitedPrisma";
// import { chatService } from "../modules/chat/chat.service";
// import { activeUsers } from "./socket";

// import {
//   ExtendedWebSocket,
//   MessageTypes,
//   storeAndSendPrivateMessage,
// } from "./socket.helpers";


// export const handleJoinApp = async (
//   ws: ExtendedWebSocket,
//   userId: string,
//   activeUsers: Map<string, ExtendedWebSocket>
// ): Promise<void> => {
//   try {
//     ws.userId = userId;

//     // Store user in active connections
//     activeUsers.set(userId, ws);

//     // Send confirmation back to client
//     ws.send(
//       JSON.stringify({
//         type: MessageTypes.AUTH_SUCCESS,
//         message: `Successfully joined`,
//       })
//     );
//   } catch (error: any) {
//     ws.send(
//       JSON.stringify({
//         type: MessageTypes.AUTH_FAILURE,
//         message: `Failed to join: ${error.message || error}`,
//       })
//     );
//   }
// };


// async function handleJoinPrivateChat(
//   ws: ExtendedWebSocket,
//   parsedData: any,
//   chatRooms: Map<string, Set<ExtendedWebSocket>>
// ) {
//   const { userId, user2Id } = parsedData;
 
//   for (const [roomId, sockets] of chatRooms.entries()) {
//     if (sockets.has(ws)) {
//       sockets.delete(ws);

//       if (sockets.size === 0) {
//         chatRooms.delete(roomId);
//       }
//     }
//   }

//   const conversation = await chatService.createConversationIntoDB(
//     userId,
//     user2Id
//   );
//   const chatroomId = conversation?.id as string;
//   ws.chatroomId = chatroomId;
//   ws.userId = userId;
//   activeUsers.set(userId, ws);
//   if (!chatRooms.has(chatroomId)) {
//     chatRooms.set(chatroomId, new Set());
//   }

//   chatRooms.get(chatroomId)?.add(ws);

//   ws.send(
//     JSON.stringify({
//       type: MessageTypes.JOIN_PRIVATE_CHAT,
//       message: `Successfully joined the private chat with user ${user2Id}`,
//       chatroomId,
//     })
//   );
//   setImmediate(async () => {
//     await prisma.privateMessage.updateMany({
//       where: {
//         conversationId: chatroomId,
//         receiverId: userId,
//         read: false,
//       },
//       data: {
//         read: true,
//       },
//     });
//   });
// }

// async function handleSendPrivateMessage(
//   ws: ExtendedWebSocket,
//   parsedData: any
// ) {
//   const { userId, user2Id, content, imageUrl } = parsedData;
//   const senderSocket = activeUsers.get(userId);
//   const conversationId = senderSocket?.chatroomId || ws.chatroomId;

//   try {
//     if (conversationId) {
//       await storeAndSendPrivateMessage(
//         ws,
//         userId,
//         user2Id,
//         content,
//         imageUrl,
//         conversationId
//       );
//     } else {
//       ws.send(
//         JSON.stringify({
//           type: MessageTypes.AUTH_FAILURE,
//           message: "Conversation ID not found for sender.",
//         })
//       );
//     }
//   } catch (error) {
//     ws.send(
//       JSON.stringify({
//         type: MessageTypes.AUTH_FAILURE,
//         message: `Error sending private message:, ${error}`,
//       })
//     );
//   }
// }

// export { handleJoinPrivateChat, handleSendPrivateMessage };
