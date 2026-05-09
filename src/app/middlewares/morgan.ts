// import morgan from "morgan";
// import prisma from "../../shared/prisma";


// morgan.token("platform", (req) => req.headers["x-platform"] as string || "unknown");

// const stream = {
//   write: async (message: string) => {
//     try {
//       const data = JSON.parse(message);

//       await prisma.traffic.create({
//         data: {
//           method: data.method,
//           endpoint: data.url,
//           status: Number(data.status),
//           responseTime: Number(data.responseTime),
//           platform: data.platform,
//           ip: data.ip,
//           userAgent: data.userAgent,
//         },
//       });
//     } catch (err) {
//       console.error("Traffic log error:", err);
//     }
//   },
// };
