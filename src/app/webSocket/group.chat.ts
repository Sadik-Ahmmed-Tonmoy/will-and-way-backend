
// import prisma from "../../shared/ommitedPrisma";
// import {
//   broadcastToGroup,
//   ExtendedWebSocket,
//   MessageTypes,
// } from "./socket.helpers";


// async function handleJoinGroup(
//   ws: ExtendedWebSocket,
//   parsedData: any,
//   groupRooms: Map<string, Set<ExtendedWebSocket>>
// ) {
//   const { userId, groupId } = parsedData;
//   ws.userId = userId;
//   ws.groupId = groupId;

//   if (!groupRooms.has(groupId)) {
//     groupRooms.set(groupId, new Set());
//   }

//   groupRooms.get(groupId)!.add(ws);
  
//   ws.send(JSON.stringify({ type: "joinSuccess", groupId }));
// }


// async function handleSendGroupMessage(
//   parsedData: any,
//   groupRooms: Map<string, Set<ExtendedWebSocket>>
// ) {
//   const { groupId, userId, content } = parsedData;
 
  
//   try {
//     const message = await prisma.groupMessage.create({
//       data: { groupId, senderId:userId, content },
//     });

//     broadcastToGroup(
//       groupId,
//       { type: MessageTypes.RECEIVED_GROUP_MESSAGE, message },
//       groupRooms
//     );
//   } catch (error) {
//     console.error("Error sending group message:", error);
//   }
// }

// export { handleJoinGroup, handleSendGroupMessage };
