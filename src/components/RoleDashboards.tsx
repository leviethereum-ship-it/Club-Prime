import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { 
  addPropertyToDb, 
  updatePropertyPriceInDb, 
  updateBookingStatusInDb, 
  updateBookingDisputeInDb, 
  addLegalVersionToDb, 
  archiveOldLegalVersionsInDb, 
  triggerEmailNotification 
} from "../lib/dbHelpers";
import { 
  UserRole, 
  Booking, 
  Property, 
  CreatorCampaign, 
  ConciergeTicket, 
  LegalTermVersion 
} from "../types";

import { 
  TrendingUp, 
  Calendar, 
  Lock, 
  Unlock, 
  DollarSign, 
  Coins, 
  User, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  QrCode, 
  MessageSquare, 
  Send, 
  Link, 
  Copy, 
  Check, 
  Upload, 
  Layers, 
  Database,
  Cpu,
  BadgeAlert,
  Sliders,
  Settings,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface RoleDashboardsProps {
  currentRole: UserRole;
  properties: Property[];
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  campaigns: CreatorCampaign[];
  tickets: ConciergeTicket[];
  setTickets: React.Dispatch<React.SetStateAction<ConciergeTicket[]>>;
  legalRegistry: LegalTermVersion[];
  setLegalRegistry: React.Dispatch<React.SetStateAction<LegalTermVersion[]>>;
  activeEmail: string;
}

export default function RoleDashboards({
  currentRole,
  properties,
  bookings,
  setBookings,
  campaigns,
  tickets,
  setTickets,
  legalRegistry,
  setLegalRegistry,
  activeEmail
}: RoleDashboardsProps) {
  // Common states
  const [copiedText, setCopiedText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // New Property Form States (Ceará Host Listings)
  const [newPropName, setNewPropName] = useState("");
  const [newPropTagline, setNewPropTagline] = useState("");
  const [newPropRegion, setNewPropRegion] = useState("Jericoacoara");
  const [newPropLocation, setNewPropLocation] = useState("");
  const [newPropPrice, setNewPropPrice] = useState(300);
  const [newPropDescription, setNewPropDescription] = useState("");
  const [newPropKuula, setNewPropKuula] = useState("");
  const [newPropImage, setNewPropImage] = useState("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [propAddSuccess, setPropAddSuccess] = useState(false);

  // Property Amenities Checkboxes
  const [isBeachfront, setIsBeachfront] = useState(true);
  const [isLuxury, setIsLuxury] = useState(true);
  const [hasPool, setHasPool] = useState(true);
  const [isPetFriendly, setIsPetFriendly] = useState(false);

  // Guest States
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(bookings[0] || null);
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatLogs, setChatLogs] = useState<Array<{sender: string; text: string; time: string}>>([
    { sender: "System", text: "Welcome to MyClubPrime Premium Chat. Your connection is encrypted on-chain.", time: "11:40 AM" },
    { sender: "Concierge", text: "Hello Levi! Your Jericoacoara VIP transfer scheduling is undergoing confirmation. Do you prefer beach buggy paths?", time: "11:45 AM" }
  ]);
  const [disputeSubject, setDisputeSubject] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [activeDisputeBookingId, setActiveDisputeBookingId] = useState<string | null>(null);

  // Host States
  const [editingPricePropertyId, setEditingPricePropertyId] = useState<string | null>(null);
  const [customPriceVal, setCustomPriceVal] = useState<number>(0);
  const [hostActiveCalendarPropertyId, setHostActiveCalendarPropertyId] = useState<string>(properties[0]?.id || "");

  // Creator States
  const [appliedCampaignId, setAppliedCampaignId] = useState<string | null>(null);
  const [referralUtmTag, setReferralUtmTag] = useState<string>("levi_prime");
  const [submittedMediaName, setSubmittedMediaName] = useState<string>("");
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState<boolean>(false);

  // Admin / Legal States
  const [newLegalVersion, setNewLegalVersion] = useState<string>("v2.5");
  const [newLegalIpfs, setNewLegalIpfs] = useState<string>("QmZpf98zS...");

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Chat send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLogs(prev => [
      ...prev,
      { sender: "You (Guest)", text: chatMessage, time: "Just Now" }
    ]);
    setChatMessage("");
    // Mock response
    setTimeout(() => {
      setChatLogs(prev => [
        ...prev,
        { sender: "Concierge Agent", text: "Message received. Your request has been logged on-chain in ticket logs.", time: "Just now" }
      ]);
    }, 1200);
  };

  // Submit dispute (Guest)
  const handleLaunchDispute = (bookingId: string) => {
    if (!disputeSubject.trim() || !disputeReason.trim()) return;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          hasActiveDispute: true,
          paymentStatus: "Disputed",
          escrowStatus: "In_Arbitration",
          disputeNotes: `${disputeSubject}: ${disputeReason}`
        };
      }
      return b;
    }));
    // Create concierge ticket
    const correspondingBooking = bookings.find(b => b.id === bookingId);
    const newTicket: ConciergeTicket = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      guestName: "Levi Gold",
      propertyName: correspondingBooking ? correspondingBooking.propertyName : "Premium Villa",
      issueType: "Dispute Resolution",
      priority: "Critical",
      status: "Open",
      description: `GUEST FILED ESCROW DISPUTE - ID: ${bookingId}. Reason: ${disputeSubject} - ${disputeReason}`,
      timestamp: "Just Now"
    };
    setTickets(prev => [newTicket, ...prev]);
    setActiveDisputeBookingId(null);
    setDisputeSubject("");
    setDisputeReason("");
  };

  // Concierge dispute action (Refund or Release)
  const handleConciergeArbitration = async (ticketId: string, action: "Refund" | "Release") => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Search for disputed booking matching guest name or property name
    const matchingBooking = bookings.find(b => b.propertyName === ticket.propertyName && b.hasActiveDispute);
    if (matchingBooking) {
      const pStatus = action === "Refund" ? "Pending" : "Released";
      const eStatus = action === "Refund" ? "Refunded" : "Fully_Released";
      await updateBookingDisputeInDb(matchingBooking.id, false, `Arbitrated Status: ${action === "Refund" ? "Refunded to Guest" : "Fully Released to Host"}`, pStatus, eStatus);
      
      // Send persistent notification email
      await triggerEmailNotification(
        activeEmail, 
        `Arbitragem Resolvida: Reserva ${matchingBooking.id}`, 
        `<h1>Arbitragem de Custódia Concluída</h1><p>Resultado: <strong>${action === "Refund" ? "Estornado para o Hóspede" : "Liberado ao Anfitrião"}</strong></p>`
      );
    }

    setBookings(prev => prev.map(b => {
      if (b.propertyName === ticket.propertyName) {
        return {
          ...b,
          hasActiveDispute: false,
          paymentStatus: action === "Refund" ? "Pending" : "Released",
          escrowStatus: action === "Refund" ? "Refunded" : "Fully_Released"
        };
      }
      return b;
    }));

    // Resolve ticket
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: "Resolved", description: `Arbitrated: ${action} processed successfully in database.` };
      }
      return t;
    }));
  };

  // Check in or Release Booking action (Host or Concierge)
  const handleValidateBooking = async (bookingId: string, newState: "Released" | "Progressive_Released") => {
    const eStatus = newState === "Released" ? "Fully_Released" : "Progressive_Released";
    await updateBookingStatusInDb(bookingId, newState, eStatus);

    await triggerEmailNotification(
      activeEmail,
      `Escrow Atualizado: Reserva ${bookingId}`,
      `<h2>Os fundos de garantias foram transitados com sucesso!</h2><p>Novo status de custódia: <strong>${eStatus}</strong></p>`
    );

    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: newState,
          escrowStatus: eStatus
        };
      }
      return b;
    }));
  };

  // Host calendar update price
  const handleSavePrice = async (propertyId: string) => {
    await updatePropertyPriceInDb(propertyId, customPriceVal);

    properties.forEach(p => {
      if (p.id === propertyId) {
        p.pricePerNightUSD = customPriceVal;
        p.pricePerNightUSDT = customPriceVal - 2;
        p.pricePerNightPIX = Math.round(customPriceVal * 5.2);
      }
    });
    setEditingPricePropertyId(null);
  };

  // Admin add new Legal Registry
  const handleAddLegalRegistry = async () => {
    if (!newLegalVersion || !newLegalIpfs) return;
    const newVer: LegalTermVersion = {
      version: newLegalVersion,
      updatedAt: "Just Now (Unsigned)",
      signatureCount: 0,
      ipfsHash: newLegalIpfs,
      status: "Active"
    };

    await archiveOldLegalVersionsInDb();
    await addLegalVersionToDb(newVer);

    setLegalRegistry(prev => [
      newVer,
      ...prev.map(l => ({ ...l, status: "Archived" as const }))
    ]);
    setNewLegalVersion("");
    setNewLegalIpfs("");
  };

  // Simulated Base64 Image Upload to mimic Firebase Storage
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadPercent(15);

    const reader = new FileReader();
    reader.onloadend = () => {
      const interval = setInterval(() => {
        setUploadPercent(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setNewPropImage(reader.result as string);
            return 100;
          }
          return prev + 25;
        });
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  // Landlord property submission
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropLocation || !newPropDescription) {
      alert("Por favor preencha Nome, Localização e Descrição.");
      return;
    }

    const payload: Property = {
      id: "", // Inner DB mapper handles autogenerated id
      name: newPropName,
      tagline: newPropTagline || "Extraordinário refúgio litorâneo privativo de alto padrão",
      region: newPropRegion as "Jericoacoara" | "Cumbuco" | "Fortaleza",
      location: newPropLocation,
      pricePerNightUSD: newPropPrice,
      pricePerNightUSDT: newPropPrice - 2,
      pricePerNightPIX: Math.round(newPropPrice * 5.2),
      imageUrl: newPropImage,
      virtualTourModelUrl: newPropKuula || "https://kuula.co/share/collection/7K7YV",
      rating: 5.0,
      reviewsCount: 1,
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      amenities: ["Air Conditioning", "High-speed Starlink", "Panoramic Deck", "Glass Pool Rim"],
      galleryUrls: [newPropImage],
      latitude: -2.7932,
      longitude: -40.5112,
      hostId: auth?.currentUser?.uid || "mock-host-id",
      hostName: auth?.currentUser?.displayName || "Anfitrião Certificado MyClubPrime",
      hostAvatar: auth?.currentUser?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
      has360Tour: true,
      isBeachfront,
      isLuxury,
      hasPool,
      isPetFriendly,
      isRemoteWorkFriendly: true,
      isFamilyFriendly: true,
      isCouplesFriendly: true,
      description: newPropDescription
    };

    setPropAddSuccess(true);

    try {
      await addPropertyToDb(payload);
      await triggerEmailNotification(
        activeEmail,
        `Seu Imóvel VIP Foi Cadastrado! - MyClubPrime`,
        `<h1>Sucesso no Indexador de Imóveis</h1><p>Olá! Seu imóvel <strong>${newPropName}</strong> foi registrado em banco de dados e está ativo na região de ${newPropRegion}.</p><p>Link de Imersão Virtual Kuula: ${payload.virtualTourModelUrl}</p>`
      );
    } catch (err) {
      console.error("Cadastro erro:", err);
    }

    // Reset values & redirect
    setTimeout(() => {
      setNewPropName("");
      setNewPropTagline("");
      setNewPropLocation("");
      setNewPropDescription("");
      setNewPropKuula("");
      setPropAddSuccess(false);
      setActiveTab("calendar"); // returns to price/listing tab
    }, 2000);
  };


  return (
    <div className="w-full" id="role-panel-container">
      {/* Visual Indicator of switched profile */}
      <div className="liquid-glass border border-turquoise/20 p-5 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-turquoise uppercase tracking-wider mb-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-turquoise"></span>
            ACTIVE HYBRID CONTEXT: {currentRole}
          </div>
          <h2 className="text-2xl font-bold text-ocean font-display">
            {currentRole === UserRole.GUEST && "Premium Guest Executive Suite"}
            {currentRole === UserRole.HOST && "Prime Host Property Control Room"}
            {currentRole === UserRole.CREATOR && "Ambassador Content Campaign Hub"}
            {currentRole === UserRole.CONCIERGE && "MyClubPrime Operations Terminal"}
            {currentRole === UserRole.ADMINISTRATOR && "Enterprise Protocol Boardroom"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Secure workspace synchronized with user identity <span className="font-mono text-ocean">{activeEmail}</span>
          </p>
        </div>

        {/* Floating Quick Tabs inside Role Environment */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "overview" 
                ? "bg-ocean text-white shadow-md" 
                : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
            }`}
          >
            Dashboard
          </button>
          {currentRole === UserRole.GUEST && (
            <>
              <button 
                onClick={() => setActiveTab("disputes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "disputes" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Disputes & Escrow ({bookings.filter(b => b.hasActiveDispute).length})
              </button>
              <button 
                onClick={() => setActiveTab("messages")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "messages" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Concierge Chat
              </button>
            </>
          )}

          {currentRole === UserRole.HOST && (
            <>
              <button 
                onClick={() => setActiveTab("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "calendar" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Pricing & Availability
              </button>
              <button 
                onClick={() => setActiveTab("add-property")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  activeTab === "add-property" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Cadastrar Imóvel (Kuula 360)
              </button>
              <button 
                onClick={() => setActiveTab("guarantee")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "guarantee" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Trust Guarantee Center
              </button>
            </>
          )}

          {currentRole === UserRole.CREATOR && (
            <>
              <button 
                onClick={() => setActiveTab("campaigns")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "campaigns" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Campaign Placements
              </button>
              <button 
                onClick={() => setActiveTab("referrals")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "referrals" 
                    ? "bg-ocean text-white shadow-md" 
                    : "bg-white/80 text-ocean border border-white/40 hover:bg-white"
                }`}
              >
                Referral Metrics
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------ 1. GUEST ENVIRONMENT ------------------ */}
      {currentRole === UserRole.GUEST && (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Your Bookings */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold text-lg text-ocean">Your Prime Bookings</h3>
                  <span className="text-xs text-gray-500">{bookings.length} reservations archived</span>
                </div>

                {bookings.length === 0 ? (
                  <div className="liquid-glass p-8 text-center rounded-2xl text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30 text-ocean" />
                    No active premium reservations found. Search properties to book a stay.
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`liquid-glass p-6 rounded-2xl border ${
                        booking.hasActiveDispute ? "border-red-200" : "border-white/40"
                      } hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}
                    >
                      <div className="flex gap-4">
                        <img 
                          src={booking.propertyImage} 
                          alt={booking.propertyName} 
                          className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-inner" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">
                              {booking.id}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                              booking.escrowStatus === "Locked" ? "bg-turquoise/10 text-turquoise" :
                              booking.escrowStatus === "Fully_Released" ? "bg-emerald-100 text-emerald-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              ESCROW: {booking.escrowStatus}
                            </span>
                          </div>
                          <h4 className="font-bold text-ocean font-display mt-1 text-base">{booking.propertyName}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Check-in: {booking.checkIn} | Check-out: {booking.checkOut}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs">
                            <span className="text-gray-500">Method: <strong className="text-ocean">{booking.paymentMethod}</strong></span>
                            <span className="text-gray-500">Locked Reserve: <strong className="text-turquoise">${booking.totalAmountUSD} USD</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => {
                            setSelectedBookingForQr(booking);
                            setActiveTab("overview");
                          }}
                          className="w-full md:w-40 py-2 bg-gradient-to-r from-ocean to-[#0E356A] text-white font-bold rounded-lg text-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          View QR-Key
                        </button>

                        {!booking.hasActiveDispute && booking.escrowStatus === "Locked" && (
                          <button 
                            onClick={() => {
                              setActiveDisputeBookingId(booking.id);
                              setActiveTab("disputes");
                            }}
                            className="w-full md:w-40 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            File Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Benefits / Credits Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="liquid-glass p-5 rounded-2xl border border-white/50 flex items-center gap-4">
                    <div className="p-3 bg-gold/10 rounded-xl text-gold">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Prime Cashback Balance</p>
                      <h4 className="text-2xl font-black text-ocean font-display">1,450 <span className="text-xs text-gold">PRIME CREDITS</span></h4>
                      <p className="text-[10px] text-turquoise mt-0.5">Equivalent to $145.00 USDT</p>
                    </div>
                  </div>

                  <div className="liquid-glass p-5 rounded-2xl border border-white/50 flex items-center gap-4">
                    <div className="p-3 bg-turquoise/10 rounded-xl text-turquoise">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Security Guarantee Status</p>
                      <h4 className="text-md font-bold text-ocean mt-0.5">100% Fully Protected</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Dual Escrow + Sovereign Vault Guarantee</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active QR and Check-In validation simulator */}
              <div className="lg:col-span-4 space-y-6">
                <div className="liquid-glass p-6 rounded-2xl border border-white/50 text-center flex flex-col items-center">
                  <h4 className="font-display font-bold text-ocean mb-1">Check-In Passport Key</h4>
                  <p className="text-xs text-gray-500 mb-6">Show physically upon check-in to confirm security clearance</p>

                  {selectedBookingForQr ? (
                    <div className="space-y-4 w-full">
                      <div className="bg-white p-4 rounded-xl inline-block border border-gray-100 shadow-md">
                        {/* Dynamic SVG Mock QR representing unique contract payload */}
                        <svg className="w-40 h-40 mx-auto" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="white" />
                          <g fill="#091e36">
                            {/* Outer Anchors */}
                            <rect x="5" y="5" width="25" height="25" rx="2" />
                            <rect x="9" y="9" width="17" height="17" fill="white" />
                            <rect x="13" y="13" width="9" height="9" />

                            <rect x="70" y="5" width="25" height="25" rx="2" />
                            <rect x="74" y="9" width="17" height="17" fill="white" />
                            <rect x="78" y="13" width="9" height="9" />

                            <rect x="5" y="70" width="25" height="25" rx="2" />
                            <rect x="9" y="74" width="17" height="17" fill="white" />
                            <rect x="13" y="78" width="9" height="9" />

                            {/* Inside random pixels representing the reservation hash signature */}
                            <rect x="35" y="10" width="8" height="8" />
                            <rect x="48" y="15" width="12" height="6" />
                            <rect x="35" y="35" width="15" height="15" />
                            <rect x="55" y="35" width="8" height="20" />
                            <rect x="40" y="60" width="20" height="12" />
                            <rect x="70" y="45" width="10" height="10" />
                            <rect x="85" y="60" width="8" height="8" />
                            <rect x="70" y="80" width="22" height="12" />
                            <rect x="35" y="80" width="10" height="10" />
                          </g>
                        </svg>
                      </div>

                      <div className="bg-turquoise/5 px-3 py-2 rounded-lg border border-turquoise/20 text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">Immutable Reservation Signature</p>
                        <p className="font-mono text-[10px] text-ocean break-all mt-1 font-bold text-center">
                          {selectedBookingForQr.securityGuaranteeStamp}
                        </p>
                      </div>

                      <div className="text-left space-y-2 pt-2 text-xs">
                        <div className="flex justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-gray-400">Security Clearance</span>
                          <span className="text-turquoise font-semibold">Granted [Escrow Active]</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-gray-400">Assigned Property</span>
                          <span className="text-ocean font-bold">{selectedBookingForQr.propertyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">On-Chain Asset Lock</span>
                          <span className="text-ocean font-bold">{selectedBookingForQr.totalAmountUSD} USDT</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Select a reservation to download visual passport</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Guest Dispute Window */}
          {activeTab === "disputes" && (
            <div className="liquid-glass p-6 rounded-2xl border border-white/50">
              <div className="flex items-center gap-2 mb-4 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-display font-bold text-xl text-ocean">On-Chain Trust & Escrow Disputes</h3>
              </div>
              <p className="text-gray-600 text-xs mb-6">
                If the property quality fails to match the 360-degree tour or features, guests can instantly lock funds in the EnterpriseEscrow smart contract. To protect funds, file your arbitration below. Host payout is paused until resolution.
              </p>

              {activeDisputeBookingId ? (
                <div className="space-y-4 max-w-xl bg-white/50 p-5 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-ocean">File Dispute on Reservation #{activeDisputeBookingId}</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Subject of Discrepancy</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Beach pool pump broken, Host uncommunicative"
                      value={disputeSubject}
                      onChange={(e) => setDisputeSubject(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-turquoise" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Elaborated Reason & Evidence</label>
                    <textarea 
                      rows={3}
                      placeholder="Explain with concrete facts. The Concierge team will cross reference physical cameras or log records."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-turquoise" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLaunchDispute(activeDisputeBookingId)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      File Smart Contract Dispute
                    </button>
                    <button 
                      onClick={() => setActiveDisputeBookingId(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-ocean">Select one of your locked escrow reservations to initiate arbitration:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookings.map(b => (
                      <div key={b.id} className="bg-white/40 p-4 border border-white/60 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-ocean">{b.propertyName}</p>
                          <p className="text-gray-400 text-[10px]">{b.id} | Locked: ${b.totalAmountUSD} USD</p>
                        </div>
                        {b.hasActiveDispute ? (
                          <span className="text-red-500 font-bold px-2.5 py-1 bg-red-50 rounded">Disputed</span>
                        ) : b.escrowStatus === "Locked" ? (
                          <button 
                            onClick={() => setActiveDisputeBookingId(b.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold tracking-wide"
                          >
                            File Arbitration
                          </button>
                        ) : (
                          <span className="text-gray-400">Escrow released</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest Chat Window */}
          {activeTab === "messages" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 liquid-glass p-6 rounded-2xl border border-white/50 flex flex-col h-[400px]">
                <h3 className="font-display font-semibold text-ocean mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-turquoise" />
                  VIP Concierge Direct Line
                </h3>

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 text-xs">
                  {chatLogs.map((log, i) => (
                    <div key={i} className={`flex flex-col ${log.sender.includes("You") ? "items-end" : "items-start"}`}>
                      <div className="flex gap-2 items-center mb-0.5">
                        <span className="font-bold text-ocean font-display">{log.sender}</span>
                        <span className="text-[9px] text-gray-400">{log.time}</span>
                      </div>
                      <div className={`p-3 rounded-xl max-w-sm border ${
                        log.sender.includes("You")
                          ? "bg-turquoise/10 border-turquoise/20 text-ocean"
                          : log.sender.includes("System")
                          ? "bg-slate-50 border-slate-200 text-gray-400 font-mono"
                          : "bg-white border-gray-100 text-gray-600 shadow-sm"
                      }`}>
                        {log.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send action bar */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask about heli transfers, buggy trips, or smart contract statuses..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 bg-white/70 border border-white/60 focus:bg-white rounded-lg focus:outline-none focus:border-turquoise"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-ocean hover:bg-[#0E356A] text-white rounded-lg transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Concierge Info Side Widget */}
              <div className="md:col-span-4 space-y-4">
                <div className="liquid-glass p-5 rounded-2xl border border-white/50">
                  <h4 className="font-display font-bold text-ocean text-sm mb-2">MyClubPrime Concierge</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Our platform concierge stands operational 24/7. They manage on-site keys verification, check-in validation, local sport booking, emergency actions, and physical validation audits.
                  </p>
                  <div className="mt-4 p-3 bg-white/50 rounded-xl border border-white/30 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Speed</span>
                      <strong className="text-turquoise">&lt; 3 mins</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Escrow Guardian</span>
                      <strong className="text-ocean">Active</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ------------------ 2. HOST ENVIRONMENT ------------------ */}
      {currentRole === UserRole.HOST && (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Host KPI Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Revenue</p>
                  <h4 className="text-lg font-extrabold text-ocean font-display mt-1">$14,520 USD</h4>
                  <span className="text-[9px] text-green-500 font-bold">↑ 12% vs last month</span>
                </div>
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Future Renters</p>
                  <h4 className="text-lg font-extrabold text-ocean font-display mt-1">4 Bookings</h4>
                  <span className="text-[9px] text-gray-400">Occupancy: 82%</span>
                </div>
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Protected Capacity</p>
                  <h4 className="text-lg font-extrabold text-turquoise font-display mt-1">100% Locked</h4>
                  <span className="text-[9px] text-turquoise">Escrow Active</span>
                </div>
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Claim</p>
                  <h4 className="text-lg font-extrabold text-emerald-600 font-display mt-1">$4,900 BRL</h4>
                  <button className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 hover:bg-emerald-200">
                    Withdraw
                  </button>
                </div>
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Referral Reward</p>
                  <h4 className="text-lg font-extrabold text-gold font-display mt-1">$720 USD</h4>
                  <span className="text-[9px] text-gray-400">From 3 ambassadors</span>
                </div>
                <div className="liquid-glass p-4 rounded-xl border border-white/40 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prime Score</p>
                  <h4 className="text-lg font-extrabold text-ocean font-display mt-1">4.92 / 5.0</h4>
                  <span className="text-[9px] text-gold font-bold">Luxe Status</span>
                </div>
              </div>

              {/* Host Reservation Matrix & Control Center */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                <div className="lg:col-span-8 liquid-glass p-6 rounded-2xl border border-white/50">
                  <h3 className="font-display font-semibold text-lg text-ocean mb-4 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-turquoise" />
                    Interactive Guest & Escrow Control Center
                  </h3>
                  <p className="text-gray-500 text-xs mb-6">
                    Manage active guest entries and request fund release from escrow upon check-in validation. If the check-in is certified by the concierge or guest, or the 24h validation timer expires, assets transition to available claim automatically.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-ocean">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400">
                          <th className="pb-3 text-[10px] uppercase font-bold">Booking Details</th>
                          <th className="pb-3 text-[10px] uppercase font-bold">Guest</th>
                          <th className="pb-3 text-[10px] uppercase font-bold">Locked Value</th>
                          <th className="pb-3 text-[10px] uppercase font-bold">Guarantee Code</th>
                          <th className="pb-3 text-[10px] uppercase font-bold">Arbitrage / Escrow State</th>
                          <th className="pb-3 text-[10px] uppercase font-bold text-right font-display">Contract Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/30 transition-colors">
                            <td className="py-4">
                              <p className="font-bold">{b.propertyName}</p>
                              <p className="text-[10px] text-gray-400">{b.id}</p>
                            </td>
                            <td className="py-4 font-medium">{b.guestName}</td>
                            <td className="py-4">
                              <p className="font-semibold">${b.totalAmountUSD} USD</p>
                              <p className="text-[9px] text-gray-400">{b.paymentMethod}</p>
                            </td>
                            <td className="py-4 font-mono text-[9px] opacity-75 break-all max-w-[120px]">{b.securityGuaranteeStamp}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.escrowStatus === "Locked" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                b.escrowStatus === "Fully_Released" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                b.escrowStatus === "Progressive_Released" ? "bg-turquoise/10 text-turquoise" :
                                "bg-rose-50 text-rose-600"
                              }`}>
                                {b.escrowStatus}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              {b.escrowStatus === "Locked" ? (
                                <div className="flex gap-1.5 justify-end">
                                  <button 
                                    onClick={() => handleValidateBooking(b.id, "Progressive_Released")}
                                    className="px-2.5 py-1 bg-turquoise text-white text-[10px] font-bold rounded hover:bg-turquoise/90 transition-colors"
                                  >
                                    Progressive Release
                                  </button>
                                  <button 
                                    onClick={() => handleValidateBooking(b.id, "Released")}
                                    className="px-2.5 py-1 bg-gradient-to-r from-ocean to-[#0E356A] text-white text-[10px] font-bold rounded hover:shadow transition-all"
                                  >
                                    Verify Full Check-In
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px] italic">Released onto ledger</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Host Security Guidelines */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="liquid-glass p-5 rounded-2xl border border-white/50 space-y-3">
                    <div className="flex items-center gap-1.5 text-gold">
                      <ShieldCheck className="h-5 w-5" />
                      <h4 className="font-display font-bold text-sm text-ocean">Host Smart Protections</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Every single booking under MyClubPrime is secured by on-chain decentralized reservation guarantees. Even if a guest cancels maliciously under 48 hours, our Hybrid Vault pays out up to 50% buffer protection to the host.
                    </p>
                    <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl space-y-2 text-xs">
                      <p className="text-[10px] font-bold text-ocean uppercase">Host Guarantee Rules:</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-600 text-[10px]">
                        <li>Guests must sign the digital agreement prior to escrow lock.</li>
                        <li>Check-In triggers secure release telemetry.</li>
                        <li>Disputes are arbitrated within 12 hours by consensus.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pricing & Availability Tuning tab */}
          {activeTab === "calendar" && (
            <div className="liquid-glass p-6 rounded-2xl border border-white/50">
              <h3 className="font-display font-semibold text-lg text-ocean mb-4 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-turquoise" />
                Property Valuation & Nightly Rates
              </h3>
              <p className="text-gray-500 text-xs mb-6">
                Adjust pricing dynamically across target regional seasons. Price is modified instantly across PIX estimates, Credit Cards, and Web3 USDT interfaces.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((p) => (
                  <div key={p.id} className="bg-white/40 p-5 rounded-xl border border-white/60 flex justify-between items-center gap-4">
                    <div className="flex gap-3">
                      <img src={p.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-ocean text-sm">{p.name}</h4>
                        <p className="text-[11px] text-gray-400">{p.location}</p>
                        <p className="text-xs transition-all text-turquoise font-semibold mt-2">
                          Rate: ${p.pricePerNightUSD} USD / ${p.pricePerNightUSDT} USDT / R$ {p.pricePerNightPIX} PIX
                        </p>
                      </div>
                    </div>

                    <div>
                      {editingPricePropertyId === p.id ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                            value={customPriceVal} 
                            onChange={(e) => setCustomPriceVal(Number(e.target.value))} 
                          />
                          <button 
                            onClick={() => handleSavePrice(p.id)}
                            className="bg-turquoise text-white font-bold p-1 rounded text-[10px] uppercase"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingPricePropertyId(p.id);
                            setCustomPriceVal(p.pricePerNightUSD);
                          }}
                          className="px-3 py-1.5 bg-ocean text-white font-bold text-xs rounded-lg hover:shadow transition-all"
                        >
                          Tune Base Rate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Guarantee Tab */}
          {activeTab === "guarantee" && (
            <div className="liquid-glass p-6 rounded-2xl border border-white/50">
              <div className="flex items-center gap-2 text-gold mb-6">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="font-display font-bold text-xl text-ocean">Host Guarantee Security Dashboard</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-5 bg-white/50 border border-gray-100 rounded-xl">
                  <h4 className="font-bold text-ocean text-sm mb-2 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-turquoise" />
                    Escrow Telemetry
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">Tracking active smart lock-ups representing verified guest allocations.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Secured Contracts</span>
                      <strong className="text-ocean">4 Properties</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-400">Total Escrow Value</span>
                      <strong className="text-turquoise">$12,850 USDT</strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/50 border border-gray-100 rounded-xl">
                  <h4 className="font-bold text-ocean text-sm mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-turquoise" />
                    Reserve Vault backing
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 font-sans">Corporate BookingGuarantee staking metrics on Polygon contract pool.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-400">Available Cap Pool</span>
                      <strong className="text-turquoise">1,500,000 USDT</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-400">Your Allocation Share</span>
                      <strong className="text-ocean">0.05%</strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/50 border border-gray-100 rounded-xl">
                  <h4 className="font-bold text-ocean text-sm mb-2 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-turquoise" />
                    Validation Countdown
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 font-sans">Automatic payout lock releasing schedules for checked-in guests.</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jericoacoara Stay</span>
                      <span className="text-amber-500 font-bold font-mono">14h 22m remaining</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cumbuco Stay</span>
                      <span className="text-emerald-500 font-bold">Validated & Claimable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "add-property" && (
            <div className="liquid-glass p-6 rounded-2xl border border-white/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-turquoise/15 rounded-xl text-turquoise">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-xl text-ocean">Cadastrar Novo Imóvel Ceará</h3>
                  <p className="text-xs text-gray-500">Expanda a rede conectando vilas luxuosas com Tours Virtuais interativos em tempo real.</p>
                </div>
              </div>

              <form onSubmit={handleCreateProperty} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-ocean">
                {/* Form left inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Nome do Imóvel *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Villa Sunset Glass Palace Jeri"
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Frase de Efeito (Tagline)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Piscina de vidro suspensa de frente para a duna sul"
                      value={newPropTagline}
                      onChange={(e) => setNewPropTagline(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Região Litorânea</label>
                      <select 
                        value={newPropRegion}
                        onChange={(e) => setNewPropRegion(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                      >
                        <option value="Jericoacoara">Jericoacoara</option>
                        <option value="Cumbuco">Cumbuco</option>
                        <option value="Fortaleza">Fortaleza</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Preço Base por Noite (USD) *</label>
                      <input 
                        type="number" 
                        required
                        min={50}
                        value={newPropPrice}
                        onChange={(e) => setNewPropPrice(Number(e.target.value))}
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Endereço Físico / Coordenadas *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Av. Beira Mar, S/N - Jericoacoara, Ceará"
                      value={newPropLocation}
                      onChange={(e) => setNewPropLocation(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Link de Compartilhamento Kuula 360 *</label>
                    <input 
                      type="url" 
                      placeholder="Ex: https://kuula.co/share/collection/7K7YV"
                      value={newPropKuula}
                      onChange={(e) => setNewPropKuula(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise font-mono"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Insira um link Kuula 360 válido para embutir na visualização de reservas do hóspede.</span>
                  </div>
                </div>

                {/* Form right inputs (Upload and amenities) */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1">Descrição Premium do Imóvel *</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Descreva a arquitetura Liquid Glass, varanda, amenidades luxuosas e localização..."
                      value={newPropDescription}
                      onChange={(e) => setNewPropDescription(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                    />
                  </div>

                  {/* Image Selector / Firebase Storage Upload simulation */}
                  <div className="bg-white/50 p-4 rounded-xl border border-dashed border-gray-200">
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-1 flex items-center gap-1.5">
                      <Upload className="h-4.5 w-4.5 text-turquoise" />
                      Upload de Imagem (Firebase Storage)
                    </label>

                    <div className="flex items-center gap-4 mt-2">
                      <img src={newPropImage} className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" alt="Preview" />
                      
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full text-[11px] file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-turquoise/10 file:text-turquoise cursor-pointer"
                        />
                        <p className="text-[9px] text-gray-400 mt-1">PNG, JPG de alta resolução. Convertido automaticamente e indexado no banco.</p>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="mt-3 space-y-1">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-turquoise transition-all duration-300" style={{ width: `${uploadPercent}%` }}></div>
                        </div>
                        <p className="text-[9px] text-turquoise font-mono font-bold animate-pulse">Enviando para bucket de mídia: {uploadPercent}% ...</p>
                      </div>
                    )}
                  </div>

                  {/* Checkboxes parameters */}
                  <div>
                    <label className="block text-[11px] font-bold text-ocean uppercase mb-2">Características & Parâmetros</label>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-2 rounded-lg border border-white/50 select-none">
                        <input type="checkbox" checked={isBeachfront} onChange={(e) => setIsBeachfront(e.target.checked)} className="rounded accent-turquoise cursor-pointer h-4 w-4" />
                        <span>🌊 Frente ao mar</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-2 rounded-lg border border-white/50 select-none">
                        <input type="checkbox" checked={isLuxury} onChange={(e) => setIsLuxury(e.target.checked)} className="rounded accent-turquoise cursor-pointer h-4 w-4" />
                        <span>💎 Luxo Prime</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-2 rounded-lg border border-white/50 select-none">
                        <input type="checkbox" checked={hasPool} onChange={(e) => setHasPool(e.target.checked)} className="rounded accent-turquoise cursor-pointer h-4 w-4" />
                        <span>🏊 Piscina Privada</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-2 rounded-lg border border-white/50 select-none">
                        <input type="checkbox" checked={isPetFriendly} onChange={(e) => setIsPetFriendly(e.target.checked)} className="rounded accent-turquoise cursor-pointer h-4 w-4" />
                        <span>🐾 Aceita Animais</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit state */}
                  <div className="pt-2 flex gap-4 items-center">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-ocean to-[#0E356A] hover:bg-[#0E356A] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md focus:outline-none"
                    >
                      <Plus className="h-4 w-4" />
                      Publicar Imóvel em Produção
                    </button>
                    
                    {propAddSuccess && (
                      <span className="text-turquoise font-bold flex items-center gap-1 font-sans animate-bounce">
                        <CheckCircle2 className="h-4 w-4" /> Salvo no Firestore!
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}


      {/* ------------------ 3. CREATOR ENVIRONMENT ------------------ */}
      {currentRole === UserRole.CREATOR && (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Campaign Placements list */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-semibold text-lg text-ocean">Available Paid Campaign Stay Opportunities</h3>
                  <span className="text-xs bg-turquoise/10 text-turquoise px-2.5 py-1 rounded-full font-bold">CREATOR ACCESS ACTIVE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="liquid-glass p-5 rounded-2xl border border-white/50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[9px] font-mono bg-gray-100 px-2 py-0.5 rounded-full text-gray-400 font-bold">{camp.id}</span>
                          <span className="text-xs font-bold text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/10">{camp.rewardType}</span>
                        </div>
                        <h4 className="font-bold text-ocean text-base font-display mt-1">{camp.propertyName}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">Region Location: {camp.region}</p>
                        <p className="text-[11px] text-gray-600 mt-3 bg-white/40 p-2.5 rounded-lg border border-white/20 italic">
                          "{camp.requirements}"
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold">Stipend Reward</p>
                          <p className="text-base font-black text-turquoise font-mono">${camp.compensationAmountUSD} USDT</p>
                        </div>
                        <div>
                          {appliedCampaignId === camp.id ? (
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                              <Check className="h-4.5 w-4.5" /> Filed
                            </span>
                          ) : (
                            <button
                              onClick={() => setAppliedCampaignId(camp.id)}
                              className="px-4 py-2 bg-ocean text-white rounded-lg text-xs font-bold hover:bg-[#0E356A] transition-all"
                            >
                              Request Property Access
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Media Submission console */}
              <div className="lg:col-span-4 space-y-6">
                <div className="liquid-glass p-5 rounded-2xl border border-white/50 space-y-4">
                  <h4 className="font-display font-bold text-ocean text-sm flex items-center gap-2">
                    <Upload className="h-5 w-5 text-turquoise" />
                    Submit Virtual Content
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Submit high-definition drone visuals, cinematic property story reels, or 360-degree panoramas to collect commissions.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Visual Scope Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Essenza Pool Drone Sequence"
                        value={submittedMediaName}
                        onChange={(e) => setSubmittedMediaName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white/60 focus:bg-white border border-gray-200 focus:outline-none focus:border-turquoise rounded-lg"
                      />
                    </div>

                    <div className="border-2 border-dashed border-gray-200 hover:border-turquoise/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-white/30"
                      onClick={() => {
                        if (!submittedMediaName.trim()) return;
                        setIsUploadingMedia(true);
                        setMediaUploadSuccess(false);
                        setTimeout(() => {
                          setIsUploadingMedia(false);
                          setMediaUploadSuccess(true);
                          setSubmittedMediaName("");
                        }, 2000);
                      }}
                    >
                      {isUploadingMedia ? (
                        <div className="flex flex-col items-center">
                          <RefreshCw className="h-8 w-8 text-turquoise animate-spin mb-2" />
                          <p className="text-xs text-gray-500 font-mono">Uploading nodes onto IPFS...</p>
                        </div>
                      ) : mediaUploadSuccess ? (
                        <div className="flex flex-col items-center text-emerald-600">
                          <CheckCircle2 className="h-8 w-8 mb-2" />
                          <p className="text-xs font-bold">Upload Completed Successfully!</p>
                          <p className="text-[10px] opacity-75 font-mono">Pending concierge audit</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Plus className="h-8 w-8 mb-1 text-turquoise" />
                          <p className="text-xs font-bold text-ocean">Drag & Drop or Click to Upload</p>
                          <p className="text-[9px] text-gray-400 mt-1">Accepts MP4, RAW, GLTF up to 250MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Referral links Generator metrics tab */}
          {activeTab === "referrals" && (
            <div className="liquid-glass p-6 rounded-2xl border border-white/50">
              <h3 className="font-display font-semibold text-lg text-ocean mb-2 flex items-center gap-2">
                <Link className="h-5 w-5 text-turquoise" />
                UTM Referral Link Engine / Campaigns Planner
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Generate secure links containing custom UTM values. Track subsequent property leads, on-chain bookings, and referral commission history dynamically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Generator */}
                <div className="bg-white/50 p-5 rounded-xl border border-white/60 space-y-4">
                  <h4 className="font-bold text-ocean text-sm">Create Ambassador Link</h4>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-bold">Your Custom UTM Campaign Identifier</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={referralUtmTag}
                        onChange={(e) => setReferralUtmTag(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-turquoise rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-ocean text-white p-4 rounded-xl space-y-2 mt-4">
                    <p className="text-[9px] font-bold uppercase text-turquoise">Your Active Referral Address</p>
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-mono text-xs font-bold select-all truncate">
                        https://myclubprime.co/stay?ref={referralUtmTag}
                      </p>
                      <button 
                        onClick={() => handleCopy(`https://myclubprime.co/stay?ref=${referralUtmTag}`, "copied_ref")}
                        className="p-1 px-2.5 bg-turquoise text-white text-[10px] rounded hover:bg-turquoise/80 hover:shadow font-bold flex items-center gap-1 whitespace-nowrap"
                      >
                        {copiedText === "copied_ref" ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="bg-white/50 p-5 rounded-xl border border-white/60 space-y-4">
                  <h4 className="font-bold text-ocean text-sm">Campaign Performance Logs</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Referral Leads</p>
                      <p className="text-xl font-bold text-ocean font-display">184 clicks</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Escrow Locked Deals</p>
                      <p className="text-xl font-bold text-turquoise font-display font-mono">3 bookings</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gold/5 border border-gold/10 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-ocean">Accumulated Commission rewards</p>
                      <p className="text-[10px] text-gray-400">Paid directly in USDT Polygon</p>
                    </div>
                    <span className="text-base font-black text-gold font-mono">$1,890 USDT</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ------------------ 4. CONCIERGE PANEL ------------------ */}
      {currentRole === UserRole.CONCIERGE && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Pending Tickets & Support operations */}
            <div className="lg:col-span-8 liquid-glass p-6 rounded-2xl border border-white/50">
              <h3 className="font-display font-semibold text-lg text-ocean mb-4 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-turquoise" />
                Active Concierge Tickets & Dispute Arbitration
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-sans">
                Manage airport transport arrangements, water sport logistics, and handle escrow dispute arbitrations between host metrics and guests.
              </p>

              <div className="space-y-4">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white/40 p-5 rounded-xl border border-white/60 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-ocean text-white font-bold px-2 py-0.5 rounded">
                          {t.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.priority === "Critical" ? "bg-red-100 text-red-800" :
                          t.priority === "High" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {t.priority} Urgent
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-ocean font-display mt-2 text-sm">{t.issueType} for {t.guestName}</h4>
                      <p className="text-gray-400 text-[10px]">Property: {t.propertyName} | Timestamp: {t.timestamp}</p>
                      <p className="text-gray-600 text-xs mt-2 italic bg-white/45 p-2 rounded-lg leading-relaxed border border-white/30">"{t.description}"</p>
                    </div>

                    <div className="flex flex-col gap-2 justify-center">
                      {t.status !== "Resolved" && t.issueType === "Dispute Resolution" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConciergeArbitration(t.id, "Refund")}
                            className="bg-red-600 font-bold hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg"
                          >
                            Arbitrate: Refund Guest
                          </button>
                          <button
                            onClick={() => handleConciergeArbitration(t.id, "Release")}
                            className="bg-emerald-600 font-bold hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg"
                          >
                            Arbitrate: Pay Host
                          </button>
                        </div>
                      )}
                      
                      {t.status !== "Resolved" && t.issueType !== "Dispute Resolution" && (
                        <button
                          onClick={() => {
                            setTickets(prev => prev.map(tick => {
                              if (tick.id === t.id) return { ...tick, status: "Resolved" as const };
                              return tick;
                            }));
                          }}
                          className="px-4 py-2 bg-ocean hover:bg-[#0E356A] text-white text-xs font-bold rounded-lg transition-colors text-center"
                        >
                          Resolve Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Emergency & Physical Operations Checklist */}
            <div className="lg:col-span-4 space-y-6">
              <div className="liquid-glass p-5 rounded-2xl border border-white/50 space-y-4">
                <h4 className="font-display font-bold text-ocean text-sm flex items-center gap-1.5">
                  <BadgeAlert className="h-5 w-5 text-turquoise" />
                  Emergency Control Board
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Triggers instant pause functions across smart contracts should emergency weather, coastal erosion or legal warnings emerge in Ceará.
                </p>

                <div className="space-y-3">
                  <button className="w-full text-left p-3 hover:bg-red-50 bg-red-50/20 border border-red-200 rounded-xl transition-all flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-red-700">Impose Civil Emergency Lock</p>
                      <p className="text-[9px] text-red-500">Freezes cancel penalties for Ceará dunes</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-red-600" />
                  </button>

                  <button className="w-full text-left p-3 hover:bg-amber-50 bg-amber-50/20 border border-amber-200 rounded-xl transition-all flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-amber-800">Postpone Escrow Release timer</p>
                      <p className="text-[9px] text-amber-600">Forces 24h delay on all payout releasing</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ------------------ 5. ADMINISTRATOR ROOM ------------------ */}
      {currentRole === UserRole.ADMINISTRATOR && (
        <div className="space-y-6">
          {/* Executive Dashboard KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="liquid-glass p-5 rounded-2xl border border-white/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Accumulated Escrow Volume</p>
                <h2 className="text-2xl font-black text-ocean mt-1 font-mono">$142,500 USDT</h2>
                <span className="text-[10px] text-green-500">100% Locked on Polygon Ledger</span>
              </div>
              <Database className="h-8 w-8 text-turquoise opacity-60" />
            </div>

            <div className="liquid-glass p-5 rounded-2xl border border-white/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Active Ecosystem Nodes</p>
                <h2 className="text-2xl font-black text-ocean mt-1">428 members</h2>
                <span className="text-[10px] text-turquoise">Travelers + verified hosts</span>
              </div>
              <Users className="h-8 w-8 text-turquoise opacity-60" />
            </div>

            <div className="liquid-glass p-5 rounded-2xl border border-white/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Liquid Host Guarantees Pool</p>
                <h2 className="text-2xl font-black text-gold mt-1 font-mono">1.5M USDT</h2>
                <span className="text-[10px] text-gold font-bold">BookingGuarantee Vault OK</span>
              </div>
              <ShieldCheck className="h-8 w-8 text-gold opacity-60" />
            </div>

            <div className="liquid-glass p-5 rounded-2xl border border-white/40 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">System Health Frequency</p>
                <h2 className="text-2xl font-black text-emerald-600 mt-1 font-mono">99.98% uptime</h2>
                <span className="text-[10px] text-emerald-600">Off-chain sync active</span>
              </div>
              <Cpu className="h-8 w-8 text-emerald-500 opacity-60" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* On-chain contracts control */}
            <div className="lg:col-span-7 liquid-glass p-6 rounded-2xl border border-white/50 space-y-6">
              <h3 className="font-display font-semibold text-lg text-ocean flex items-center gap-2">
                <SettingIcon />
                Protocol Governance & Terms Versions System
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Version legal documentation, digital signature contracts and inspect IPFS telemetry blocks. Uploading a new terms hash forces host signatures upon payout withdrawal requests.
              </p>

              {/* Version List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-ocean uppercase">IPFS HostTermsRegistry Ledger</p>
                {legalRegistry.map((leg, i) => (
                  <div key={i} className="bg-white/40 p-4 border border-white/50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ocean">{leg.version}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                          leg.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"
                        }`}>
                          {leg.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 break-all select-all">IPFS: {leg.ipfsHash}</p>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-bold text-ocean">{leg.signatureCount} signatures</p>
                      <p className="text-[10px] text-gray-400">{leg.updatedAt}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form to submit new version */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-gray-200 space-y-3">
                <p className="text-xs font-bold text-ocean">Register New Legality Version</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Version Indicator</label>
                    <input 
                      type="text" 
                      placeholder="e.g. v2.5-ESCRW"
                      value={newLegalVersion}
                      onChange={(e) => setNewLegalVersion(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">IPFS Storage Hash</label>
                    <input 
                      type="text" 
                      placeholder="e.g. QmZpf98zS..."
                      value={newLegalIpfs}
                      onChange={(e) => setNewLegalIpfs(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded font-mono" 
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddLegalRegistry}
                  className="px-4 py-2 bg-ocean hover:bg-[#0E356A] text-white text-xs font-bold rounded-lg transition-all"
                >
                  Publish and Require Signatures
                </button>
              </div>
            </div>

            {/* Right Column: Active Ledger updates */}
            <div className="lg:col-span-5 liquid-glass p-6 rounded-2xl border border-white/50">
              <h3 className="font-display font-semibold text-lg text-ocean mb-4 flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-turquoise" />
                Immutable Event Observers
              </h3>
              
              <div className="space-y-3 font-mono text-[10px] text-gray-600">
                <div className="p-3 bg-ocean/90 text-[#f3e5ab] rounded-lg">
                  <p className="text-[#14b8a6] font-bold">[EVENT LOG: ESCROW_LOCK]</p>
                  <p>Tx: 0x7ea92cc3db8257cc7a199be87bb221facd5ef109</p>
                  <p>Value: 2,600 USDT locked for Levi Gold.</p>
                  <p className="text-right text-[8px] opacity-75">June 01, 23:25</p>
                </div>

                <div className="p-3 bg-white/40 border border-white/55 rounded-lg text-ocean">
                  <p className="text-turquoise font-bold">[EVENT LOG: DIGITAL_SIGNATURE]</p>
                  <p>Ambassador signed: Rodrigo Melo for Cumbuco Stay.</p>
                  <p>Hash: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco</p>
                  <p className="text-right text-[8px] opacity-75">June 01, 22:50</p>
                </div>

                <div className="p-3 bg-white/40 border border-white/55 rounded-lg text-ocean">
                  <p className="opacity-60 text-gray-400">[EVENT LOG: SYSTEM_PING]</p>
                  <p>Corporate reserve capacity validation check passed (1,500,000 USDT Vault Liquidity active).</p>
                  <p className="text-right text-[8px] opacity-75">June 01, 22:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimalist local helper render to bypass icon duplication
function SettingIcon() {
  return (
    <span className="p-1.5 bg-turquoise/10 rounded-lg text-turquoise">
      <Settings className="h-4 w-4" />
    </span>
  );
}
