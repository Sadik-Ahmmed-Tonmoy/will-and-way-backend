import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { initiateSuperAdmin } from './app/DB';
import config from './config';
import { redis } from './lib/redis';
import { messageWorker } from './workers/messagePersistence.worker';
import {  seedDemoUser } from './app/DB/seedCategories';
import dns from 'dns';
import { initializeStripeProducts } from './app/utils/stripe';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const port = config.port || 5000;

async function main() {
  const server: HTTPServer = createServer(app).listen(port, async () => {
    console.log('🚀 Server is running on port', port);
    await initiateSuperAdmin();
    await seedDemoUser();
    await initializeStripeProducts();
    console.log('🎉 Seeding complete!');
  });

  // Attach Socket.IO with CORS
  const io = new SocketServer(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:53284',
        'http://206.162.244.142',
      ],
      credentials: true,
    },
  });

  // redis shutdown handler
  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    await messageWorker.close();
    // await captainHireExpirationWorker.close();
    // await paymentCaptureWorker.close();
    // await bookingExpirationWorker.close();

    await redis.quit();
    process.exit(0);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info('Server closed!');
      });
    }
    process.exit(1);
  };

  process.on('uncaughtException', error => {
    console.log(error);
    exitHandler();
  });

  process.on('unhandledRejection', error => {
    console.log(error);
    exitHandler();
  });
}

main();
