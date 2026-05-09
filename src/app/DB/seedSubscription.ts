// import prisma from "../../shared/ommitedPrisma";
// // import { subscriptionPlanService } from "../modules/SubscriptionPlan/subscriptionPlan.service";


// // export async function seedSubscription() {
// //   console.log("🌱 Seeding VIP subscription plan...");

// //   const vipPlan = {
// //     displayName: "VIP",
// //     subTitle: "$50 / month",
// //     category: "VIP",
// //     planFor: "GENERAL",
// //     duration: "MONTHLY",
// //     price: 50,
// //     features: [
// //       "Unlimited swipes",
// //       "Unlimited messages",
// //       "Profile customization",
// //       "Boost visibility in the feed",
// //     ],
// //   };

// //   try {
// //     await subscriptionPlanService.createSubscriptionPlan({
// //       displayName: vipPlan.displayName,
// //       subTitle: vipPlan.subTitle,
// //       category: vipPlan.category,
// //       planFor: vipPlan.planFor,
// //       duration: vipPlan.duration,
// //       price: vipPlan.price,
// //       features: vipPlan.features,
// //     });

// //     console.log("✅ VIP plan created successfully");
// //   } catch (err: any) {
// //     if (err?.message?.includes("already exists")) {
// //       console.log("⚠️ VIP plan already exists");
// //     } else {
// //       console.error("❌ Failed to create VIP plan", err);
// //     }
// //   }

// //   console.log("🌱 VIP subscription seeding completed.");
// // }

// export const createIndexes = async () => {
//   await prisma.$runCommandRaw({
//     createIndexes: "user_profiles",
//     indexes: [
//       {
//         key: { location: "2dsphere" },
//         name: "location_2dsphere",
//       },
//     ],
//   });

//   console.log("✅ Geo index ensured on user_profiles.location");
// };