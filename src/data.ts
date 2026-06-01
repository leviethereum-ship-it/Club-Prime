import { Property, CreatorCampaign, Booking, ConciergeTicket, LegalTermVersion, Review } from "./types";

export const masterProperties: Property[] = [
  {
    id: "prop-essenza-jeri",
    name: "Essenza Luxury Glass Villa",
    tagline: "Spectacular private pool veranda over looking Jericoacoara beach",
    location: "Jericoacoara Ocean Front, Ceará",
    region: "Jericoacoara",
    pricePerNightUSD: 520,
    pricePerNightUSDT: 518,
    pricePerNightPIX: 2700, // 2700 BRL
    rating: 4.95,
    reviewsCount: 142,
    bedrooms: 4,
    bathrooms: 4.5,
    maxGuests: 8,
    amenities: [
      "Infinity Veranda Pool",
      "Direct Beach Access",
      "8K Smart TV",
      "Private Concierge Team",
      "Gourmet Outdoor Grill",
      "High-speed Starlink WiFi",
      "Spa & Dry Sauna",
      "Kitesurf Storage",
      "Equipped Modern Kitchen"
    ],
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80"
    ],
    latitude: -2.795,
    longitude: -40.512,
    description: "Suspended between the azure waters of Ceará and the legendary white dunes of Jericoacoara, Essenza Luxury Glass Villa is an architectural masterpiece. Crafted utilizing custom frosted glass pane structures and floating wooden decks, this estate delivers unprecedented intimacy with Brazil's northern surf. Step directly from your climate-controlled master suite into a pristine glass-molded veranda pool.",
    hostId: "host-prime-01",
    hostName: "Amelia Cavalcanti",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    has360Tour: true,
    isBeachfront: true,
    isLuxury: true,
    hasPool: true,
    isPetFriendly: false,
    isRemoteWorkFriendly: true,
    isFamilyFriendly: true,
    isCouplesFriendly: true
  },
  {
    id: "prop-cumbuco-wind",
    name: "Cumbuco Liquid Wave Estate",
    tagline: "The premier global hotspot for wind riders and remote visionaries",
    location: "Praia de Cumbuco, Caucaia",
    region: "Cumbuco",
    pricePerNightUSD: 390,
    pricePerNightUSDT: 388,
    pricePerNightPIX: 2000,
    rating: 4.89,
    reviewsCount: 96,
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    amenities: [
      "Beachfront Deck",
      "Kite Launching Platform",
      "Dedicated Glass Studio Office",
      "Hot Tub",
      "Chef Service Optional",
      "Pet Friendly Zones",
      "Solar Backup Power",
      "Water Sports Concierge"
    ],
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"
    ],
    latitude: -3.621,
    longitude: -38.732,
    description: "Engineered specifically for water sports enthusiasts and dual-lifestyle creators. Situated in Cumbuco, the global mecca for kitesurfing, this property offers steady trade winds, a secure private launch yard, and custom workstations overlooking the ocean. Blends organic wood columns with Apple-style polished metallic trim.",
    hostId: "host-prime-02",
    hostName: "Rodrigo Melo",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    has360Tour: true,
    isBeachfront: true,
    isLuxury: true,
    hasPool: true,
    isPetFriendly: true,
    isRemoteWorkFriendly: true,
    isFamilyFriendly: true,
    isCouplesFriendly: true
  },
  {
    id: "prop-forta-penthouse",
    name: "Meireles Elite Platinum Penthouse",
    tagline: "Panoramic 38th-floor luxury over the Beira Mar skyline",
    location: "Avenida Beira Mar, Fortaleza",
    region: "Fortaleza",
    pricePerNightUSD: 450,
    pricePerNightUSDT: 445,
    pricePerNightPIX: 2350,
    rating: 4.97,
    reviewsCount: 88,
    bedrooms: 5,
    bathrooms: 6,
    maxGuests: 10,
    amenities: [
      "Panoramic Skyline Deck",
      "Private Elevators",
      "Smart Home Glass automation",
      "Soundproof Music Lounge",
      "Heated Pool with LED Matrix",
      "Double Garage Slots",
      "24/7 VIP Concierge Room"
    ],
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
    ],
    latitude: -3.725,
    longitude: -38.498,
    description: "Soaring high above Fortaleza's pristine Meireles district, the Elite Platinum Penthouse embodies premium high-density metropolitan luxury. Outfitted with bespoke Italian marble, fully interactive digital walls, and a suspended hot tub floating at the skyline's edge, it presents the ultimate home base for business councils, creators, and VIP families.",
    hostId: "host-prime-03",
    hostName: "Silvia Castro",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    has360Tour: true,
    isBeachfront: true,
    isLuxury: true,
    hasPool: true,
    isPetFriendly: false,
    isRemoteWorkFriendly: true,
    isFamilyFriendly: true,
    isCouplesFriendly: false
  },
  {
    id: "prop-prea-oasis",
    name: "Preá Sunset Palm Bungalow",
    tagline: "Rustic minimal paradise with premium modern conveniences",
    location: "Praia do Preá, Cruz",
    region: "Jericoacoara",
    pricePerNightUSD: 310,
    pricePerNightUSDT: 308,
    pricePerNightPIX: 1600,
    rating: 4.82,
    reviewsCount: 54,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    amenities: [
      "Natural Palm Canopy",
      "Organic Gardens",
      "Outdoor Stone Showers",
      "Pet Running Field",
      "Starlink Ground Station",
      "Cocktail Bar Lounge"
    ],
    imageUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1473116763269-255ea7b215f1?auto=format&fit=crop&w=600&q=80"
    ],
    latitude: -2.812,
    longitude: -40.408,
    description: "Embrace raw Ceará beauty without compromising digital comfort. Located on the expanses of Preá sand beach, this estate merges handcrafted native palm thatch roofs with high-strength floor-to-ceiling panoramic glass panels. Beautiful, calm, and perfectly secure with automated smart-lock nodes.",
    hostId: "host-prime-01",
    hostName: "Amelia Cavalcanti",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    has360Tour: false,
    isBeachfront: true,
    isLuxury: false,
    hasPool: false,
    isPetFriendly: true,
    isRemoteWorkFriendly: true,
    isFamilyFriendly: false,
    isCouplesFriendly: true
  }
];

export const mockCreatorCampaigns: CreatorCampaign[] = [
  {
    id: "camp-jeri-01",
    propertyName: "Essenza Luxury Glass Villa",
    region: "Jericoacoara",
    rewardType: "Free Stay + 10% UTM",
    requirements: "At least 15k followers on IG/TikTok, high-production Drone video & 3 custom reels spotlighting local beachfront life",
    compensationAmountUSD: 1200,
    spotsLeft: 2,
    applicantsCount: 34
  },
  {
    id: "camp-cumbuco-02",
    propertyName: "Cumbuco Liquid Wave Estate",
    region: "Cumbuco",
    rewardType: "Free Stay + 10% UTM",
    requirements: "Kitesurfing specialized creators or Tech/Nomad lifestyle vloggers. Minimum 10k reach, high fidelity GoPro content series",
    compensationAmountUSD: 850,
    spotsLeft: 3,
    applicantsCount: 19
  },
  {
    id: "camp-forta-03",
    propertyName: "Meireles Elite Platinum Penthouse",
    region: "Fortaleza",
    rewardType: "Stripe Cash + 15% Comm",
    requirements: "Luxury travel curators. 30k followers. Focus on architectural detailing, evening skyline panoramas, and private chef experience tour",
    compensationAmountUSD: 2100,
    spotsLeft: 1,
    applicantsCount: 47
  }
];

export const mockReviews: Record<string, Review[]> = {
  "prop-essenza-jeri": [
    {
      id: "rev-1",
      userName: "Michael Chen",
      userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
      rating: 5,
      date: "May 12, 2026",
      comment: "Absolutely mind-blowing ocean access. The glass-bottomed edge of the pool hanging directly over the sand feels magical. Amelia and her physical concierge team checked us in flawlessly and we felt 100% secure with the Booking Guarantee protocol."
    },
    {
      id: "rev-2",
      userName: "Gabriela Brandão",
      userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
      rating: 5,
      date: "April 29, 2026",
      comment: "A flawless stay. Starlink worked flawlessly so I spent mornings working in the private glass office overlooking Jeri dunes, and afternoons kitesurfing. The smart contract escrow validation on Polygon gave us massive confidence in our reservation."
    }
  ],
  "prop-cumbuco-wind": [
    {
      id: "rev-3",
      userName: "Alex van der Berg",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
      rating: 4.8,
      date: "May 20, 2026",
      comment: "Incredible launchpad. Literally step off your patio onto optimal kite launch sand. The host Rodrigo provides specialized air pressure compressors and gear storage right on site."
    }
  ]
};

// Initial default reservations to showcase real dashboards right out-of-the-box
export const initialBookings: Booking[] = [
  {
    id: "RES-769213",
    propertyId: "prop-essenza-jeri",
    propertyName: "Essenza Luxury Glass Villa",
    propertyImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80",
    guestId: "guest-levi-01",
    guestName: "Levi Gold",
    hostId: "host-prime-01",
    checkIn: "2026-06-15",
    checkOut: "2026-06-20",
    totalAmountUSD: 2600,
    totalAmountFiatBRL: 13500,
    paymentMethod: "USDT Polygon",
    paymentStatus: "Escrow_Locked",
    escrowStatus: "Locked",
    securityGuaranteeStamp: "poly_0x7ea92cc3db8257cc7a199be87bb221facd5ef109",
    blockchainTxHash: "0x7ea92cc3db8257cc7a199be87bb221facd5ef1098e7bbef1629851cbdcf10a8c",
    checkInQrCode: "MYCLUBPRIME-GUEST-LEVI-ESSENZA-2026",
    hasActiveDispute: false
  },
  {
    id: "RES-882104",
    propertyId: "prop-cumbuco-wind",
    propertyName: "Cumbuco Liquid Wave Estate",
    propertyImage: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80",
    guestId: "guest-levi-01",
    guestName: "Levi Gold",
    hostId: "host-prime-02",
    checkIn: "2026-07-02",
    checkOut: "2026-07-08",
    totalAmountUSD: 2340,
    totalAmountFiatBRL: 12000,
    paymentMethod: "PIX",
    paymentStatus: "Escrow_Locked",
    escrowStatus: "Locked",
    securityGuaranteeStamp: "pix_0x8fdc99aa887c122a9e38e1219fc088b77a0",
    blockchainTxHash: "0x8fdc99aa887c122a9e38e1219fc088b77a0bcdd199f8dbe39f88dcc10a12",
    checkInQrCode: "MYCLUBPRIME-GUEST-LEVI-CUMBUCO-2026",
    hasActiveDispute: false
  }
];

export const initialConciergeTickets: ConciergeTicket[] = [
  {
    id: "TKT-302",
    guestName: "Alice Dubois",
    propertyName: "Essenza Luxury Glass Villa",
    issueType: "Custom Transfers Request",
    priority: "High",
    status: "Open",
    description: "Wants a dual-engine Mercedes Sprinter transfer from Fortaleza (FOR) Airport direct to Jericoacoara via beaches at low tide.",
    timestamp: "2026-06-01 22:15"
  },
  {
    id: "TKT-305",
    guestName: "Robert Vance",
    propertyName: "Cumbuco Liquid Wave Estate",
    issueType: "Water Sports Rental",
    priority: "Medium",
    status: "Assigned",
    description: "Requesting two 2026 Core XR Pro 12m kites and Duotone carbon twin-tip boards delivered prior to check-in.",
    timestamp: "2026-06-01 23:05"
  }
];

export const initialLegalRegistry: LegalTermVersion[] = [
  {
    version: "v2.4-ESCRW",
    updatedAt: "2026-05-15 09:00",
    signatureCount: 412,
    ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    status: "Active"
  },
  {
    version: "v2.3-GUARANTEE",
    updatedAt: "2026-01-20 14:30",
    signatureCount: 890,
    ipfsHash: "QmYwNPNZSTB1mYnXLZ_NOT_REAL_HASH_ipfsY93WknFi",
    status: "Archived"
  }
];

export const localGuides = {
  Jericoacoara: {
    attractions: [
      { name: "Pedra Furada Archaic Arch", distance: "2.4 km", icon: "Mountain" },
      { name: "Sunset Dune (Duna do Pôr do Sol)", distance: "0.8 km", icon: "Sun" },
      { name: "Lagoa do Paraíso Beach Lounges", distance: "12 km", icon: "Sunset" }
    ],
    restaurants: [
      { name: "Pimenta Verde Bistro", cuisine: "Seafood fusion", distance: "0.4 km" },
      { name: "Lobo do Mar Jeri", cuisine: "Luxury Grill", distance: "0.6 km" }
    ]
  },
  Cumbuco: {
    attractions: [
      { name: "Cauípe Lagoon Freestyle Hotspot", distance: "5.5 km", icon: "Wind" },
      { name: "Sand buggy Dunes Safari tour", distance: "1.2 km", icon: "Compass" }
    ],
    restaurants: [
      { name: "Milos Beach Club", cuisine: "Greek Seaside", distance: "0.2 km" },
      { name: "Secret Garden Cumbuco", cuisine: "International grill", distance: "0.9 km" }
    ]
  },
  Fortaleza: {
    attractions: [
      { name: "Beira Mar Traditional Craft Fair", distance: "0.1 km", icon: "ShoppingBag" },
      { name: "Dragão do Mar Culture Complex", distance: "4.2 km", icon: "Map" }
    ],
    restaurants: [
      { name: "Coco Bambu Meireles", cuisine: "Premium Marine Seafood", distance: "1.1 km" },
      { name: "Cabaña del Primo", cuisine: "Fine Argentinian cuts", distance: "1.4 km" }
    ]
  }
};
