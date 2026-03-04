const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showDriverDisputes() {
  try {
    console.log('🔍 Checking driver disputes...');
    
    // Get all disputes
    const disputes = await prisma.reviewDispute.findMany({
      include: {
        review: {
          include: {
            booking: {
              include: {
                passenger: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                  }
                },
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
            }
          }
        },
        driver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (disputes.length === 0) {
      console.log('❌ No disputes found.');
      return;
    }

    console.log(`\n📊 Found ${disputes.length} driver disputes:`);
    console.log('='.repeat(80));

    disputes.forEach((dispute, index) => {
      console.log(`\n${index + 1}. 🚨 Dispute ID: ${dispute.id}`);
      console.log(`   Driver: ${dispute.driver.firstName} ${dispute.driver.lastName} (${dispute.driver.username})`);
      console.log(`   Passenger: ${dispute.review.booking.passenger.firstName} ${dispute.review.booking.passenger.lastName} (${dispute.review.booking.passenger.username})`);
      console.log(`   Original Review: ${dispute.review.rating} ⭐`);
      console.log(`   Review Comment: ${dispute.review.comment || 'No comment'}`);
      console.log(`   Dispute Reason: ${dispute.reason}`);
      console.log(`   Dispute Detail: ${dispute.detail}`);
      console.log(`   Status: ${dispute.status}`);
      console.log(`   Created: ${new Date(dispute.createdAt).toLocaleString('th-TH')}`);
      
      if (dispute.adminNote) {
        console.log(`   Admin Note: ${dispute.adminNote}`);
      }
      if (dispute.resolvedAt) {
        console.log(`   Resolved: ${new Date(dispute.resolvedAt).toLocaleString('th-TH')}`);
      }
    });

    console.log(`\n🎯 Test Instructions:`);
    console.log(`   1. Login as any driver account that has disputes`);
    console.log(`   2. Go to the driver review/dispute section`);
    console.log(`   3. View the disputed reviews and their status`);
    console.log(`   4. Drivers can see their dispute details`);
    console.log(`   5. Admin can review and resolve disputes`);

    console.log(`\n🔑 Driver Login Credentials:`);
    const drivers = [...new Set(disputes.map(d => d.driver))];
    drivers.forEach(driver => {
      console.log(`   ${driver.username}: ${driver.username.toLowerCase()}@example.com (password: password123)`);
    });

  } catch (error) {
    console.error('❌ Error checking driver disputes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showDriverDisputes();
