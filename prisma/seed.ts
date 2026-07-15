import { PrismaClient, SpaceSlug } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.space.upsert({
    where: { slug: SpaceSlug.GROUNDS },
    update: {
      name: "The Grounds",
      description:
        "Open-air grounds for photography and gatherings. Up to 2 guests may share overlapping hours.",
      hourlyRate: 6000,
      maxCapacity: 2,
      openHour: 8,
      closeHour: 20,
    },
    create: {
      slug: SpaceSlug.GROUNDS,
      name: "The Grounds",
      description:
        "Open-air grounds for photography and gatherings. Up to 2 guests may share overlapping hours.",
      hourlyRate: 6000,
      maxCapacity: 2,
      openHour: 8,
      closeHour: 20,
    },
  });

  await prisma.space.upsert({
    where: { slug: SpaceSlug.GLASS_HOUSE },
    update: {
      name: "The Glass House",
      description:
        "Private glass house studio for photography. Exclusive hourly bookings.",
      hourlyRate: 12500,
      maxCapacity: 1,
      openHour: 8,
      closeHour: 20,
    },
    create: {
      slug: SpaceSlug.GLASS_HOUSE,
      name: "The Glass House",
      description:
        "Private glass house studio for photography. Exclusive hourly bookings.",
      hourlyRate: 12500,
      maxCapacity: 1,
      openHour: 8,
      closeHour: 20,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
