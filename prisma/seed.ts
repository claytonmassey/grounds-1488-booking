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

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Grounds Collective",
      homeEyebrow: "Photography & event bookings",
      homeLede:
        "Two friendly spaces to shoot or gather — pick the one that fits your day, then book by the hour.",
      footerText:
        "Grounds Collective · Hourly bookings for The Grounds & The Glass House",
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
