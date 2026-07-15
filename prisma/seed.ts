import { BookingPurpose, PrismaClient, SpaceSlug, UserRole } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const groundsGallery = [
  {
    url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80",
    alt: "Open grassy field in soft daylight",
    caption: "Open lawn",
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
    alt: "Tree canopy with filtered light",
    caption: "Natural shade",
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80",
    alt: "Morning mist over landscape",
    caption: "Golden hour",
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
    alt: "Rolling outdoor landscape",
    caption: "Wide angles",
  },
];

const glassGallery = [
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
    alt: "Bright interior with large windows",
    caption: "Glass walls",
  },
  {
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b9?w=1600&q=80",
    alt: "Minimal studio interior with daylight",
    caption: "Clean interior",
  },
  {
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
    alt: "Architectural glass structure",
    caption: "Architecture",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
    alt: "Modern glass building exterior",
    caption: "Exterior",
  },
];

async function main() {
  await prisma.space.upsert({
    where: { slug: SpaceSlug.GROUNDS },
    update: {
      name: "The Grounds",
      description:
        "Open-air grounds for photography and gatherings. Up to 2 guests may share overlapping hours.",
      kicker: "Outdoors",
      tagline: "Photography & events among the open grounds",
      cardBlurb:
        "Open-air grounds with soft natural light — great for portrait sessions, styled shoots, and small outdoor events.",
      bullets: [
        "Photography & events",
        "$60 / hour",
        "Shared capacity of 2",
        "Book 1 hour, a few hours, or the day",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY, BookingPurpose.EVENT],
      pageIntro:
        "Wide lawns, soft tree line, and open sky — The Grounds is built for portraits, fashion tests, and small outdoor gatherings.",
      pageBody:
        "Book by the hour for photography sessions or events. Overlapping bookings are welcome until the shared party total reaches two guests.",
      gallery: groundsGallery,
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
      kicker: "Outdoors",
      tagline: "Photography & events among the open grounds",
      cardBlurb:
        "Open-air grounds with soft natural light — great for portrait sessions, styled shoots, and small outdoor events.",
      bullets: [
        "Photography & events",
        "$60 / hour",
        "Shared capacity of 2",
        "Book 1 hour, a few hours, or the day",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY, BookingPurpose.EVENT],
      pageIntro:
        "Wide lawns, soft tree line, and open sky — The Grounds is built for portraits, fashion tests, and small outdoor gatherings.",
      pageBody:
        "Book by the hour for photography sessions or events. Overlapping bookings are welcome until the shared party total reaches two guests.",
      gallery: groundsGallery,
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
      kicker: "Indoor light",
      tagline: "Private glass house studio for photography",
      cardBlurb:
        "A bright glass house studio made for photography — clean lines, glowing light, and the space all to yourself.",
      bullets: [
        "Photography only",
        "$125 / hour",
        "Private — exclusive booking",
        "Book 1 hour, a few hours, or the day",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY],
      pageIntro:
        "Floor-to-ceiling glass, clean lines, and even natural light — The Glass House is a private studio for photography only.",
      pageBody:
        "Every booking is exclusive. Bring a small crew, style the room lightly, and work the light from every angle.",
      gallery: glassGallery,
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
      kicker: "Indoor light",
      tagline: "Private glass house studio for photography",
      cardBlurb:
        "A bright glass house studio made for photography — clean lines, glowing light, and the space all to yourself.",
      bullets: [
        "Photography only",
        "$125 / hour",
        "Private — exclusive booking",
        "Book 1 hour, a few hours, or the day",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY],
      pageIntro:
        "Floor-to-ceiling glass, clean lines, and even natural light — The Glass House is a private studio for photography only.",
      pageBody:
        "Every booking is exclusive. Bring a small crew, style the room lightly, and work the light from every angle.",
      gallery: glassGallery,
      hourlyRate: 12500,
      maxCapacity: 1,
      openHour: 8,
      closeHour: 20,
    },
  });

  const seasonalGallery = [
    {
      url: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1600&q=80",
      alt: "Festive styled interior with warm lights",
      caption: "Seasonal styling",
    },
  ];

  await prisma.space.upsert({
    where: { slug: SpaceSlug.SEASONAL_SETS },
    update: {
      name: "Seasonal Sets",
      description:
        "Limited-run styled rooms. Each set has its own dates, rate, and capacity.",
      kicker: "Limited run",
      tagline: "Styled seasonal rooms — book the set that fits your shoot",
      cardBlurb:
        "Styled seasonal rooms with their own dates, rates, and guest limits — click a set to book.",
      bullets: [
        "Photography-focused sets",
        "Rates set per room",
        "Available only during each set’s dates",
        "Book by the hour",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY],
      pageIntro:
        "Our Seasonal Sets rotate through the year — each room is dressed for a limited window.",
      pageBody:
        "Browse the current sets, check availability dates, and book the room that matches your shoot.",
      gallery: seasonalGallery,
      hourlyRate: 20000,
      maxCapacity: 4,
      openHour: 8,
      closeHour: 20,
    },
    create: {
      slug: SpaceSlug.SEASONAL_SETS,
      name: "Seasonal Sets",
      description:
        "Limited-run styled rooms. Each set has its own dates, rate, and capacity.",
      kicker: "Limited run",
      tagline: "Styled seasonal rooms — book the set that fits your shoot",
      cardBlurb:
        "Styled seasonal rooms with their own dates, rates, and guest limits — click a set to book.",
      bullets: [
        "Photography-focused sets",
        "Rates set per room",
        "Available only during each set’s dates",
        "Book by the hour",
      ],
      purposes: [BookingPurpose.PHOTOGRAPHY],
      pageIntro:
        "Our Seasonal Sets rotate through the year — each room is dressed for a limited window.",
      pageBody:
        "Browse the current sets, check availability dates, and book the room that matches your shoot.",
      gallery: seasonalGallery,
      hourlyRate: 20000,
      maxCapacity: 4,
      openHour: 8,
      closeHour: 20,
    },
  });

  const sampleSets = [
    {
      slug: "cinnamon-sugar-in-the-ivy",
      name: "Cinnamon Sugar in the Ivy",
      imageUrl:
        "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200&q=80",
      hourlyRate: 20000,
      availableFrom: "2026-09-19",
      availableTo: "2026-12-25",
      maxCapacity: 4,
      sortOrder: 1,
    },
    {
      slug: "coco-and-cashmere-in-the-dahlia",
      name: "Coco and Cashmere in the Dahlia",
      imageUrl:
        "https://images.unsplash.com/photo-1482514194978-2ed7efd166ee?w=1200&q=80",
      hourlyRate: 20000,
      availableFrom: "2026-09-19",
      availableTo: "2026-12-25",
      maxCapacity: 4,
      sortOrder: 2,
    },
    {
      slug: "sugar-plum-in-the-delphinium",
      name: "Sugar Plum in the Delphinium",
      imageUrl:
        "https://images.unsplash.com/photo-1545622783-b3e01473cdbf?w=1200&q=80",
      hourlyRate: 20000,
      availableFrom: "2026-09-19",
      availableTo: "2026-12-25",
      maxCapacity: 4,
      sortOrder: 3,
    },
    {
      slug: "emerald-grove-in-the-rosewood",
      name: "Emerald Grove in the Rosewood",
      imageUrl:
        "https://images.unsplash.com/photo-1576919228236-a097c6a17ec9?w=1200&q=80",
      hourlyRate: 25000,
      availableFrom: "2026-10-24",
      availableTo: "2026-11-01",
      maxCapacity: 4,
      sortOrder: 4,
    },
  ];

  for (const set of sampleSets) {
    await prisma.seasonalSet.upsert({
      where: { slug: set.slug },
      update: {
        name: set.name,
        imageUrl: set.imageUrl,
        imageAlt: set.name,
        hourlyRate: set.hourlyRate,
        maxCapacity: set.maxCapacity,
        availableFrom: set.availableFrom,
        availableTo: set.availableTo,
        purposes: [BookingPurpose.PHOTOGRAPHY],
        published: true,
        sortOrder: set.sortOrder,
        openHour: 8,
        closeHour: 20,
      },
      create: {
        slug: set.slug,
        name: set.name,
        description: "",
        imageUrl: set.imageUrl,
        imageAlt: set.name,
        hourlyRate: set.hourlyRate,
        maxCapacity: set.maxCapacity,
        availableFrom: set.availableFrom,
        availableTo: set.availableTo,
        purposes: [BookingPurpose.PHOTOGRAPHY],
        published: true,
        sortOrder: set.sortOrder,
        openHour: 8,
        closeHour: 20,
      },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      homeLede:
        "Three ways to shoot — The Grounds, Glass House, and rotating Seasonal Sets. Pick what fits, then book by the hour.",
      footerText:
        "Grounds Collective · Hourly bookings for The Grounds, Glass House & Seasonal Sets",
    },
    create: {
      id: "default",
      siteName: "Grounds Collective",
      homeEyebrow: "Photography & event bookings",
      homeLede:
        "Three ways to shoot — The Grounds, Glass House, and rotating Seasonal Sets. Pick what fits, then book by the hour.",
      footerText:
        "Grounds Collective · Hourly bookings for The Grounds, Glass House & Seasonal Sets",
    },
  });

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? "admin@groundscollective.com"
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme-admin";
  const adminName = process.env.ADMIN_NAME ?? "Site Admin";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: UserRole.ADMIN,
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: UserRole.ADMIN,
      passwordHash: hashPassword(adminPassword),
    },
  });

  console.log(`Admin ready: ${adminEmail}`);
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
