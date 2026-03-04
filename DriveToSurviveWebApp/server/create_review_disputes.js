const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createReviewDisputes() {
  try {
    console.log('🔄 Creating review disputes for drivers to contest...');
    
    // Get existing reviews that drivers can dispute
    const reviews = await prisma.rideReview.findMany({
      include: {
        booking: {
          include: {
            route: {
              include: {
                driver: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        passenger: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }
    });

    if (reviews.length === 0) {
      console.log('❌ No reviews found to create disputes for.');
      return;
    }

    // Create dispute reasons and details
    const disputeData = [
      {
        reason: 'UNFAIR_RATING',
        detail: 'ผู้โดยสารให้คะแนนต่ำเกินไป แม้ว่าบริการดีเยี่ยม ขับรถปลอดภัย มาตรงเวลา และรถสะอาด ควรได้รับคะแนน 5 ดาว ไม่ใช่ 3 ดาว',
        driverIndex: 0
      },
      {
        reason: 'FALSE_ACCUSATION',
        detail: 'ผู้โดยสารกล่าวหาว่าขับรถเร็วเกินไป แต่จริงๆ แล้วขับรถตามความเร็วที่กำหนด และสภาพถนนดี ไม่มีการบ่นนัยและให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก',
        driverIndex: 1
      },
      {
        reason: 'MISUNDERSTANDING',
        detail: 'มีความเข้าใจผิดเกี่ยวกับเวลาที่มาถึง ผู้โดยสารบอกว่ามาสาย แต่จริงๆ แล้วมาตรงเวลาตามนัด และได้แจ้งผู้โดยสารล่วงหน้าแล้วว่าจะมาถึงตรงเวลา',
        driverIndex: 2
      }
    ];

    const createdDisputes = [];

    for (let i = 0; i < Math.min(3, reviews.length); i++) {
      const review = reviews[i];
      const dispute = disputeData[i];
      
      // Check if dispute already exists
      const existingDispute = await prisma.reviewDispute.findFirst({
        where: {
          reviewId: review.id,
          driverId: review.booking.route.driver.id
        }
      });

      if (!existingDispute) {
        const newDispute = await prisma.reviewDispute.create({
          data: {
            reviewId: review.id,
            driverId: review.booking.route.driver.id,
            reason: dispute.reason,
            detail: dispute.detail,
            status: 'PENDING'
          }
        });

        createdDisputes.push({
          dispute: newDispute,
          review: review,
          driver: review.booking.route.driver,
          passenger: review.booking.passenger
        });

        console.log(`✅ Created dispute for driver ${review.booking.route.driver.username}:`);
        console.log(`   Review Rating: ${review.rating} ⭐`);
        console.log(`   Review Comment: ${review.comment?.substring(0, 50) || 'No comment'}...`);
        console.log(`   Dispute Reason: ${dispute.reason}`);
        console.log(`   Dispute Detail: ${dispute.detail.substring(0, 60)}...`);
        console.log(`   Status: PENDING`);
      }
    }

    // Show summary
    console.log(`\n🎉 Successfully created ${createdDisputes.length} review disputes!`);
    console.log('📊 Summary:');
    
    createdDisputes.forEach((item, index) => {
      console.log(`\n${index + 1}. 🚨 Dispute ID: ${item.dispute.id}`);
      console.log(`   Driver: ${item.driver.firstName} ${item.driver.lastName} (${item.driver.username})`);
      console.log(`   Passenger: ${item.passenger.firstName} ${item.passenger.lastName} (${item.passenger.username})`);
      console.log(`   Original Review: ${item.review.rating} ⭐ - ${item.review.comment?.substring(0, 30) || 'No comment'}...`);
      console.log(`   Dispute Reason: ${item.dispute.reason}`);
      console.log(`   Status: ${item.dispute.status}`);
      console.log(`   Created: ${new Date(item.dispute.createdAt).toLocaleString('th-TH')}`);
    });

    console.log(`\n🎯 Test Instructions:`);
    console.log(`   1. Login as any driver account that has disputes`);
    console.log(`   2. Go to the driver review section`);
    console.log(`   3. Find the disputed reviews`);
    console.log(`   4. View the dispute details and status`);
    console.log(`   5. Admin can review and resolve disputes`);

    console.log(`\n🔑 Driver Login Credentials:`);
    const drivers = [...new Set(createdDisputes.map(item => item.driver))];
    drivers.forEach(driver => {
      console.log(`   ${driver.username}: ${driver.username.toLowerCase()}@example.com (password: password123)`);
    });

  } catch (error) {
    console.error('❌ Error creating review disputes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createReviewDisputes();
