import { ObjectId } from 'bson';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import { redis } from '../../../lib/redis';
import { messagePersistenceQueue } from '../../../queues/messagePersistence.queue';
import prisma from '../../../shared/prisma';
import { ISendMessage } from './chat.interface';

const USER_CACHE_TTL = 3600; // 1 hour
const CONVERSATION_LIST_MAX = 50; // keep last 20 conversations per user
const RECENT_MESSAGES_MAX = 50; // keep last 20 messages per conversation in Redis

// Helper: get or cache user details
const getUserDetails = async (userId: string) => {
  const key = `user:${userId}`;
  let user = await redis.hgetall(key);
  if (Object.keys(user).length === 0) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, profileImage: true },
    });
    if (!dbUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    user = {
      id: dbUser.id,
      fullName: dbUser.fullName || '',
      profileImage: dbUser.profileImage || '',
    };
    await redis.hset(key, user);
    await redis.expire(key, USER_CACHE_TTL);
  }
  return user;
};

// Get or create conversation (only DB, not Redis yet)
const createOrGetConversation = async (participantIds: string[]) => {
  if (participantIds.length !== 2) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Exactly two participants required',
    );
  }
  const existing = await prisma.conversation.findFirst({
    where: { participants: { hasEvery: participantIds } },
    select: { id: true, participants: true, createdAt: true },
  });
  if (existing) return existing;

  const conversation = await prisma.conversation.create({
    data: { participants: participantIds },
    select: { id: true, participants: true, createdAt: true },
  });
  return conversation;
};

// Send a message – store in Redis and queue for persistence
const sendMessage = async (payload: ISendMessage & { senderId: string }) => {
  const { conversationId, senderId, content, imageUrl } = payload;

  // Get conversation participants (from Redis cache or DB)
  let participants: string[] | null = null;
  const convKey = `conv:${conversationId}`;
  const cached = await redis.hgetall(convKey);
  if (Object.keys(cached).length && cached.participants) {
    participants = JSON.parse(cached.participants);
  } else {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv)
      throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found');
    participants = conv.participants;
    await redis.hset(convKey, 'participants', JSON.stringify(participants));
    await redis.expire(convKey, 86400); // 24h
  }

  if (!participants || !participants.includes(senderId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not a participant');
  }

  // Generate a temporary ID
  // const messageId = `msg:${Date.now()}:${Math.random().toString(36).substr(2, 8)}`;
  const messageId = new ObjectId().toString();
  const timestamp = Date.now();

  const messageData = {
    id: messageId,
    conversationId,
    senderId,
    content,
    imageUrl: imageUrl || null,
    createdAt: timestamp,
  };

  // Get sender details
  const sender = await getUserDetails(senderId);

  // Full message object for storage and return
  const fullMessage = {
    ...messageData,
    createdAt: new Date(timestamp).toISOString(),
    sender,
  };

  // Store message in Redis sorted set (per conversation)
  await redis.zadd(
    `conv:msgs:${conversationId}`,
    timestamp,
    JSON.stringify(fullMessage),
  );
  await redis.zremrangebyrank(
    `conv:msgs:${conversationId}`,
    0,
    -RECENT_MESSAGES_MAX - 1,
  );

  // Update conversation lists for participants
  const lastMessagePreview =
    content.slice(0, 15) + (content.length > 15 ? '...' : '');
  const now = Date.now();
  for (const userId of participants) {
    await redis.zadd(`user:conv:${userId}`, now, conversationId);
    await redis.zremrangebyrank(
      `user:conv:${userId}`,
      0,
      -CONVERSATION_LIST_MAX - 1,
    );
  }

  // Store conversation metadata
  await redis.hset(`conv:meta:${conversationId}`, {
    lastMessage: lastMessagePreview,
    lastMessageTime: now,
    participants: JSON.stringify(participants),
  });
  await redis.expire(`conv:meta:${conversationId}`, 86400);

  // Queue message for persistence
  await messagePersistenceQueue.add(
    'messagePersistence',
    { conversationId, message: messageData, participants },
    {
      // delay: 5000, // delay to allow for potential quick edits/deletions
      // attempts: 5,
      // backoff: { type: 'exponential', delay: 1000 },

      jobId: messageId,
    }, // idempotency
  );

  // Return the full message object (with sender details)
  return fullMessage;
};

// Get user's conversations (from Redis sorted set)
const getUserConversations = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const conversationIds = await redis.zrevrange(
    `user:conv:${userId}`,
    start,
    end,
  );

  if (!conversationIds.length) {
    return { meta: { total: 0, page, limit, totalPages: 0 }, data: [] };
  }

  const conversations = await Promise.all(
    conversationIds.map(async cid => {
      const meta = await redis.hgetall(`conv:meta:${cid}`);
      if (!Object.keys(meta).length) return null;
      const participants = JSON.parse(meta.participants);
      const otherUserId = participants.find((id: string) => id !== userId);
      const otherUser = await getUserDetails(otherUserId);
      return {
        conversationId: cid,
        participants: [await getUserDetails(userId), otherUser],
        lastMessage: meta.lastMessage,
        lastMessageTime: new Date(Number(meta.lastMessageTime)),
      };
    }),
  );

  const filtered = conversations.filter(Boolean);
  const total = await redis.zcard(`user:conv:${userId}`);

  return {
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    data: filtered,
  };
};

// Get messages in a conversation – merge Redis and DB, deduplicate, paginate
const getMessages = async (
  conversationId: string,
  userId: string,
  page: number,
  limit: number,
) => {
  // Verify user is participant
  const meta = await redis.hgetall(`conv:meta:${conversationId}`);
  if (!Object.keys(meta).length) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv || !conv.participants.includes(userId)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not a participant');
    }
  } else {
    const participants = JSON.parse(meta.participants);
    if (!participants.includes(userId)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not a participant');
    }
  }

  // Fetch all messages from Redis (most recent)
  const redisRaw = await redis.zrevrange(`conv:msgs:${conversationId}`, 0, -1);
  const redisMessages = redisRaw.map(msg => JSON.parse(msg));

  // Fetch all messages from DB (including older ones)
  const dbMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, fullName: true, profileImage: true } },
    },
  });

  // Convert DB messages to a format consistent with Redis messages
  const formattedDbMessages = dbMessages.map(msg => ({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    imageUrl: msg.imageUrl,
    createdAt: msg.createdAt.toISOString(),
    sender: msg.sender,
  }));

  // Combine, sort descending by createdAt
  const allMessages = [...redisMessages, ...formattedDbMessages];
  allMessages.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Remove duplicates (if a message appears in both Redis and DB)
  const uniqueMap = new Map();
  for (const msg of allMessages) {
    if (!uniqueMap.has(msg.id)) {
      uniqueMap.set(msg.id, msg);
    }
  }
  const uniqueMessages = Array.from(uniqueMap.values());

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const paginated = uniqueMessages.slice(start, end + 1);
  const total = uniqueMessages.length;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: { total, page, limit, totalPages },
    data: paginated,
  };
};

// Get conversation participants (for socket notifications)
const getConversationParticipants = async (conversationId: string) => {
  const meta = await redis.hgetall(`conv:meta:${conversationId}`);
  if (Object.keys(meta).length) {
    return JSON.parse(meta.participants);
  }
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participants: true },
  });
  return conv?.participants;
};

// Sync user conversations from DB to Redis (called on login)
const syncUserConversations = async (userId: string) => {
  const count = await redis.zcard(`user:conv:${userId}`);
  if (count > 0) return;

  const conversations = await prisma.conversation.findMany({
    where: { participants: { has: userId } },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, content: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: CONVERSATION_LIST_MAX,
  });

  for (const conv of conversations) {
    const lastMsg = conv.messages[0];
    if (!lastMsg) continue;
    const timestamp = lastMsg.createdAt.getTime();
    const lastMessagePreview = lastMsg.content.slice(0, 50);
    await redis.zadd(`user:conv:${userId}`, timestamp, conv.id);
    await redis.hset(`conv:meta:${conv.id}`, {
      lastMessage: lastMessagePreview,
      lastMessageTime: timestamp,
      participants: JSON.stringify(conv.participants),
    });
  }
};

export const ChatService = {
  createOrGetConversation,
  sendMessage,
  getUserConversations,
  getMessages,
  getConversationParticipants,
  syncUserConversations,
};
