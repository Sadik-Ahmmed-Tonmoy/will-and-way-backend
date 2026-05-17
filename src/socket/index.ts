// import { Server, Socket } from 'socket.io';
// import { socketAuth } from './middleware';

// export const setupSocket = (io: Server) => {
//   io.use(socketAuth);

//   io.on('connection', (socket: Socket) => {
//     const userId = socket.data.user.id;
//     console.log(`User ${userId} connected`);

//     // Join user's personal room for notifications
//     socket.join(`user:${userId}`);

//     socket.on('join-conversation', async (payload: any) => {
//       const userId = socket.data.user.id;
//       const receiverId = payload.receiverId;
//       console.log('userId', userId, 'receiverID', receiverId);
//       const result = await ChatService.createOrGetConversation([
//         userId,
//         receiverId,
//       ]);
//       console.log(result);
//       if (!result) {
//         socket.emit('error', { error: 'Failed to join conversation' });
//         return;
//       }
//       await socket.join(`conversation:${result.id}`);
//       await socket.emit('conversation-joined', { conversationId: result.id });
//     });

//     socket.on(
//       'send-message',
//       async (data: {
//         conversationId: string;
//         content: string;
//         imageUrl?: string;
//       }) => {
//         try {
//           const message = await ChatService.sendMessage({
//             conversationId: data.conversationId,
//             senderId: userId,
//             content: data.content,
//             imageUrl: data.imageUrl,
//           });

//           // Broadcast to the conversation room
//           io.to(`conversation:${data.conversationId}`).emit(
//             'new-message',
//             message,
//           );

//           // Notify the other participant via user room
//           const participants = await ChatService.getConversationParticipants(
//             data.conversationId,
//           );
//           const otherUserId = participants?.find((id: string) => id !== userId);
//           if (otherUserId) {
//             io.to(`user:${otherUserId}`).emit('new-message-notification', {
//               conversationId: data.conversationId,
//               message,
//             });
//           }
//         } catch (error) {
//           console.error('Error sending message:', error);
//           socket.emit('message-error', { error: 'Failed to send message' });
//         }
//       },
//     );

//     socket.on('typing', (conversationId: string) => {
//       socket
//         .to(`conversation:${conversationId}`)
//         .emit('user-typing', { userId, conversationId });
//     });

//     socket.on('disconnect', () => {
//       console.log(`User ${userId} disconnected`);
//     });
//   });
// };
