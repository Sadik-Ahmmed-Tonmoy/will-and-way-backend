// import { WebSocketServer } from "ws";

// import {
//   handleJoinApp,
//   handleJoinPrivateChat,
//   handleSendPrivateMessage,
// } from "./private.chat"
// import startKeepAlive from "./startKeepAlive";
// import { parse } from "url";
// import querystring from "querystring";
// import { ExtendedWebSocket, handleDisconnect, MessageTypes } from "./socket.helpers";
// import { validateToken } from "./validateToken";
// import { handleJoinGroup, handleSendGroupMessage } from "./group.chat";
// import { chatService } from "../modules/chat/chat.service";


// export const activeUsers = new Map<string, ExtendedWebSocket>();

// export const chatRooms = new Map<string, Set<ExtendedWebSocket>>();
// const groupRooms = new Map<string, Set<ExtendedWebSocket>>();
// let wss: WebSocketServer;

// export default function socketConnect(server: any) {
//   wss = new WebSocketServer({ server });

//   wss.on("connection", async (ws: ExtendedWebSocket, req) => {
//     const urlParts = parse(req.url || "");
//     const queryParams = querystring.parse(urlParts.query || "");

 
//     let token = req.headers["x-token"] as string;
//     if (!token) {
//       token = queryParams.token as string;
//     }

//     const userId = await validateToken(ws, token);
    

//     if (!userId) {
//       return;
//     }
//     const keepAliveInterval = startKeepAlive(ws);
//     ws.on("message", async (data: string) => {
//       try {
//         let parsedData = JSON.parse(data);
//         parsedData.userId = userId;

//         switch (parsedData.type) {
//           case MessageTypes.JOIN_APP:
//             await handleJoinApp(ws, userId as unknown as string, activeUsers);
//             break;
//           case MessageTypes.JOIN_PRIVATE_CHAT:
//             await handleJoinPrivateChat(ws, parsedData, chatRooms);
//             break;
//           case MessageTypes.SEND_PRIVATE_MESSAGE:
//             await handleSendPrivateMessage(ws, parsedData);
//             break;
//             case MessageTypes.JOIN_GROUP:
//             await handleJoinGroup(ws, parsedData, groupRooms);
//             break;

//           case MessageTypes.SEND_GROUP_MESSAGE:
//             await handleSendGroupMessage(parsedData, groupRooms);
//             break;
//           case MessageTypes.CONVERSATION_LIST:
//             try {
//               const { userId, page = 1, limit = 10 } = parsedData;
//               const conversationList =
//                 await chatService.getConversationListIntoDB(
//                   userId,
//                   Number(page),
//                   Number(limit)
//                 );
//               const receiverSocket = activeUsers.get(userId);
//               if (receiverSocket) {
//                 receiverSocket.send(
//                   JSON.stringify({
//                     type: MessageTypes.CONVERSATION_LIST,
//                     conversationList,
//                   })
//                 );
//               }
//             } catch (error) {
//               ws.send(
//                 JSON.stringify({
//                   type: MessageTypes.FAILURE,
//                   message: error,
//                 })
//               );
//             }
//             break;

//           default:
//             console.log("Unknown WebSocket message types:", parsedData.type);
//         }
//       } catch (error) {
//         console.error("Error handling WebSocket messages:", error);
//       }
//     });
//     ws.on("close", () => {
//       clearInterval(keepAliveInterval);
//       handleDisconnect(ws);
//     });
//   });
// }
