import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Create Users based on the CSV facts
  const names = ['Aisha', 'Rohan', 'Priya', 'Meera', 'Dev', 'Sam']
  
  const users = await Promise.all(
    names.map((name) => 
      prisma.user.upsert({
        where: { email: `${name.toLowerCase()}@example.com` },
        update: {},
        create: {
          name,
          email: `${name.toLowerCase()}@example.com`,
          password: 'password123', // In a real app, hash this!
        },
      })
    )
  )

  console.log('Created Users:', users.map(u => u.name).join(', '))

  // Create a Group
  const group = await prisma.group.create({
    data: {
      name: 'Flatmates',
    }
  })

  // Add members with timelines
  // Meera left end of March
  // Sam joined mid-April
  const timelineRules: Record<string, { joinedAt?: Date; leftAt?: Date }> = {
    Meera: { leftAt: new Date('2026-03-31T23:59:59Z') },
    Sam: { joinedAt: new Date('2026-04-15T00:00:00Z') },
  }

  for (const user of users) {
    const rules = timelineRules[user.name as keyof typeof timelineRules] || { joinedAt: new Date('2026-01-01T00:00:00Z') }
    
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        joinedAt: rules.joinedAt || new Date('2026-01-01T00:00:00Z'),
        leftAt: rules.leftAt || null,
      }
    })
  }

  console.log('Group and members created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
