export enum UserRole {
  GUEST = "Guest",
  HOST = "Host",
  CREATOR = "Creator",
  CONCIERGE = "Concierge",
  ADMINISTRATOR = "Administrator"
}

export interface Property {
  id: string;
  name: string;
  tagline: string;
  location: string;
  region: "Jericoacoara" | "Cumbuco" | "Fortaleza";
  pricePerNightUSD: number;
  pricePerNightUSDT: number;
  pricePerNightPIX: number; // in BRL
  rating: number;
  reviewsCount: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  imageUrl: string;
  galleryUrls: string[];
  videoUrl?: string;
  virtualTourModelUrl?: string;
  latitude: number;
  longitude: number;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  has360Tour: boolean;
  isBeachfront: boolean;
  isLuxury: boolean;
  hasPool: boolean;
  isPetFriendly: boolean;
  isRemoteWorkFriendly: boolean;
  isFamilyFriendly: boolean;
  isCouplesFriendly: boolean;
}

export interface VirtualHotspot {
  id: string;
  label: string;
  x: number; // percentage pos 0-100
  y: number; // percentage pos 0-100
  description: string;
  nearbyContext?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  guestId: string;
  guestName: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  totalAmountUSD: number;
  totalAmountFiatBRL: number;
  paymentMethod: "PIX" | "Credit Card" | "USDT Polygon";
  paymentStatus: "Pending" | "Paid" | "Escrow_Locked" | "Released" | "Disputed";
  escrowStatus: "Inactive" | "Locked" | "Progressive_Released" | "Fully_Released" | "Refunded" | "In_Arbitration";
  securityGuaranteeStamp: string; // Hash/blockchain uuid
  blockchainTxHash?: string;
  checkInQrCode: string;
  disputeNotes?: string;
  hasActiveDispute: boolean;
}

export interface CreatorCampaign {
  id: string;
  propertyName: string;
  region: string;
  rewardType: "Free Stay + 10% UTM" | "Stripe Cash + 15% Comm" | "Exclusive Jetset + 12% Comm";
  requirements: string;
  compensationAmountUSD: number;
  spotsLeft: number;
  applicantsCount: number;
}

export interface CreatorContentSubmission {
  id: string;
  campaignId: string;
  creatorName: string;
  propertyName: string;
  mediaType: "Drone Video" | "360 Panorama" | "High Res Photography" | "IG Reel Outline";
  status: "Pending Review" | "Approved" | "Live";
  performanceMetrics?: {
    views: number;
    clicks: number;
    referralsCount: number;
    earnedUSD: number;
  };
}

export interface ConciergeTicket {
  id: string;
  guestName: string;
  propertyName: string;
  issueType: "Check-in Assist" | "Custom Transfers Request" | "Dispute Resolution" | "Water Sports Rental" | "Emergency Action";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Assigned" | "Resolved";
  description: string;
  timestamp: string;
}

export interface LegalTermVersion {
  version: string;
  updatedAt: string;
  signatureCount: number;
  ipfsHash: string;
  status: "Active" | "Archived";
}
