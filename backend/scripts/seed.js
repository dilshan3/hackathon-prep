const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/lib/auth');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create a support user
    const supportPassword = await hashPassword('SupportPass123!');
    const supportUser = await prisma.user.upsert({
      where: { email: 'support@deliverytracker.com' },
      update: {},
      create: {
        email: 'support@deliverytracker.com',
        passwordHash: supportPassword,
        name: 'Support Agent',
        role: 'SUPPORT'
      }
    });
    console.log('✅ Created support user:', supportUser.email);

    // Create a customer user
    const customerPassword = await hashPassword('CustomerPass123!');
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        passwordHash: customerPassword,
        name: 'John Customer',
        role: 'CUSTOMER'
      }
    });
    console.log('✅ Created customer user:', customerUser.email);

    // Create sample issues
    const sampleIssues = [
      {
        orderId: 'ORD-001',
        type: 'LATE',
        severity: 'HIGH',
        description: 'Package was supposed to arrive yesterday but still not delivered. Customer is waiting urgently for medical supplies.',
        customerId: customerUser.id
      },
      {
        orderId: 'ORD-002',
        type: 'DAMAGED',
        severity: 'MEDIUM',
        description: 'Package arrived with visible damage to the outer box. Contents appear to be intact but customer is concerned.',
        customerId: customerUser.id
      },
      {
        orderId: 'ORD-003',
        type: 'LOST',
        severity: 'HIGH',
        description: 'Package shows as delivered but customer never received it. Tracking shows it was left at the door but nothing was found.',
        customerId: customerUser.id
      }
    ];

    for (const issueData of sampleIssues) {
      const issue = await prisma.issue.upsert({
        where: { orderId: issueData.orderId },
        update: {},
        create: issueData
      });
      console.log('✅ Created issue:', issue.orderId);
    }

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Support User: support@deliverytracker.com / SupportPass123!');
    console.log('Customer User: customer@example.com / CustomerPass123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
