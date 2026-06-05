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
    await prisma.merchant.deleteMany()
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

    // Personal user (regular Gmail) — no merchant, represents a traveler/payer
    await prisma.user.create({
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
    console.log('✅ Created personal user: jane@gmail.com')

    // Create a demo merchant owned by the business user
    console.log('🏪 Creating demo merchant...')
    const merchant = await prisma.merchant.create({
      data: {
        id: 'merchant-demo-1',
        name: 'Acme Coffee Shop',
        payoutAccount: 'john@acmecorp.com',
        targetCurrency: 'SGD',
        targetCountry: 'SG',
        userId: businessUser.id,
      }
    })
    console.log(`✅ Created merchant: ${merchant.name}`)

    // Create mock payments for the demo merchant
    console.log('💳 Creating mock payments...')

    await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        recipientId: 'recipient-123',
        transferId: 'transfer-456',
        paymentUrl: 'https://wise.com/pay/abc123',
        qrCode: 'data:image/png;base64,mock-qr-code-data',
        amount: 150.00,
        currency: 'USD',
        status: 'COMPLETED'
      }
    })

    await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        paymentUrl: 'https://wise.com/pay/def456',
        amount: 75.50,
        currency: 'EUR',
        status: 'PENDING'
      }
    })

    console.log('✅ Created 2 mock payments')

    // Create a mock post
    await prisma.post.create({
      data: {
        title: 'Welcome to WiseQRPay!',
        content: 'This is a test post to verify database connectivity.'
      }
    })

    console.log('✅ Created mock post: Welcome to WiseQRPay!')

    // Summary
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log('   - Users: 2 (1 business/merchant owner, 1 personal/traveler)')
    console.log('   - Merchants: 1')
    console.log('   - Payments: 2 (traveler payments, userId=null)')
    console.log('   - Posts: 1')

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
