// scripts/seed-database.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Clear existing data (optional - be careful in production!)
    console.log('🧹 Cleaning existing data...')
    await prisma.payment.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.post.deleteMany()

    // Create mock users
    console.log('👤 Creating mock users...')
    
    // Business user (Google Workspace)
    const businessUser = await prisma.user.create({
      data: {
        id: 'business-user-1',
        name: 'John Business',
        email: 'john@acmecorp.com',
        isBusiness: true,
        emailVerified: new Date(),
        image: 'https://via.placeholder.com/150'
      }
    })

    // Personal user (regular Gmail)
    const personalUser = await prisma.user.create({
      data: {
        id: 'personal-user-1', 
        name: 'Jane Personal',
        email: 'jane@gmail.com',
        isBusiness: false,
        emailVerified: new Date(),
        image: 'https://via.placeholder.com/150'
      }
    })

    console.log(`✅ Created business user: ${businessUser.email}`)
    console.log(`✅ Created personal user: ${personalUser.email}`)

    // Create mock payments for business user
    console.log('💳 Creating mock payments...')
    
    const payment1 = await prisma.payment.create({
      data: {
        userId: businessUser.id,
        recipientId: 'recipient-123',
        transferId: 'transfer-456',
        paymentUrl: 'https://wise.com/pay/abc123',
        qrCode: 'data:image/png;base64,mock-qr-code-data',
        amount: 150.00,
        currency: 'USD',
        status: 'COMPLETED'
      }
    })

    const payment2 = await prisma.payment.create({
      data: {
        userId: businessUser.id,
        recipientId: 'recipient-789',
        transferId: 'transfer-101',
        paymentUrl: 'https://wise.com/pay/def456',
        amount: 75.50,
        currency: 'EUR',
        status: 'PENDING'
      }
    })

    console.log(`✅ Created ${2} mock payments`)

    // Create a mock post
    const post = await prisma.post.create({
      data: {
        title: 'Welcome to WiseQRPay!',
        content: 'This is a test post to verify database connectivity.'
      }
    })

    console.log(`✅ Created mock post: ${post.title}`)

    // Summary
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - Users: 2 (1 business, 1 personal)`)
    console.log(`   - Payments: 2`)
    console.log(`   - Posts: 1`)

  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  })
