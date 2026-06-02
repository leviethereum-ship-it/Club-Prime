import React, { useState, useEffect } from "react";
import { auth, firebaseAvailable } from "./lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  saveUserProfile, 
  fetchUserProfile, 
  subscribeToBookings, 
  subscribeToProperties, 
  subscribeToTickets, 
  subscribeToLegal,
  addBookingToDb,
  triggerEmailNotification
} from "./lib/dbHelpers";
import { 
  UserRole, 
  Property, 
  Booking, 
  ConciergeTicket, 
  LegalTermVersion 
} from "./types";
import { 
  masterProperties, 
  mockCreatorCampaigns, 
  initialBookings, 
  initialConciergeTickets, 
  initialLegalRegistry,
  localGuides
} from "./data";
import VirtualTour from "./components/VirtualTour";
import RoleDashboards from "./components/RoleDashboards";
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  Check, 
  CreditCard, 
  Coins, 
  Users, 
  Lock, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  AlertCircle,
  Menu,
  ChevronRight,
  Sparkle,
  RefreshCw
} from "lucide-react";

export default function App() {
  // Application State
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GUEST);
  const [selectedProperty, setSelectedProperty] = useState<Property>(masterProperties[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  
  // Property Attribute toggles
  const [filterBeachfront, setFilterBeachfront] = useState<boolean>(false);
  const [filterLuxury, setFilterLuxury] = useState<boolean>(false);
  const [filterPool, setFilterPool] = useState<boolean>(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState<boolean>(false);

  // Subscription Dynamic collections
  const [properties, setProperties] = useState<Property[]>(masterProperties);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [tickets, setTickets] = useState<ConciergeTicket[]>(initialConciergeTickets);
  const [legalRegistry, setLegalRegistry] = useState<LegalTermVersion[]>(initialLegalRegistry);

  // Auth States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authRole, setAuthRole] = useState<UserRole>(UserRole.GUEST);
  const [authError, setAuthError] = useState<string>("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>("");

  // Mercado Pago PIX Checkout States
  const [mpPixModalOpen, setMpPixModalOpen] = useState<boolean>(false);
  const [mpPixData, setMpPixData] = useState<{
    qrCodeUrl: string;
    copyPasteCode: string;
    amount: number;
    bookingId: string;
  } | null>(null);
  const [mpPixLoading, setMpPixLoading] = useState<boolean>(false);

  // Email notifications monitors
  const [emailLogsOpen, setEmailLogsOpen] = useState<boolean>(false);
  const [activeOutboundEmails, setActiveOutboundEmails] = useState<any[]>([]);

  useEffect(() => {
    // 1. Auth state monitor
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile: any = await fetchUserProfile(user.uid);
        if (profile?.role) {
          setCurrentRole(profile.role as UserRole);
        }
      } else {
        setCurrentUser(null);
      }
    });

    // 2. subscribe to Properties
    const unsubProps = subscribeToProperties((updatedProps) => {
      if (updatedProps.length > 0) {
        // Merge presets with Firestore custom properties
        const merged = [
          ...masterProperties.filter(mp => !updatedProps.some(up => up.id === mp.id)),
          ...updatedProps
        ];
        setProperties(merged);
        
        // Auto update selected view if needed
        const stillExists = merged.find(p => p.id === selectedProperty.id);
        if (stillExists) {
          setSelectedProperty(stillExists);
        } else if (merged.length > 0) {
          setSelectedProperty(merged[0]);
        }
      }
    });

    // 5. subscribe to Legal Registry versions
    const unsubLegal = subscribeToLegal((updatedLegal) => {
      if (updatedLegal.length > 0) {
        setLegalRegistry(updatedLegal);
      }
    });

    // 6. Poll transactional email notification stack
    const fetchEmailLogs = async () => {
      try {
        const res = await fetch("/api/notifications/logs");
        const data = await res.json();
        if (data?.logs) {
          setActiveOutboundEmails(data.logs);
        }
      } catch (err) {
        console.warn("SMTP simulation offline during build boot:", err);
      }
    };
    fetchEmailLogs();
    const emailPoller = setInterval(fetchEmailLogs, 4000);

    return () => {
      unsubAuth();
      unsubProps();
      unsubLegal();
      clearInterval(emailPoller);
    };
  }, [selectedProperty.id]);

  // Subscriptions requiring active authentication session
  useEffect(() => {
    if (!currentUser) return;

    // 3. subscribe to Bookings
    const unsubBookings = subscribeToBookings((updatedBookings) => {
      if (updatedBookings.length > 0) {
        setBookings(updatedBookings);
      }
    });

    // 4. subscribe to Tickets
    const unsubTickets = subscribeToTickets((updatedTickets) => {
      if (updatedTickets.length > 0) {
        setTickets(updatedTickets);
      }
    });

    return () => {
      unsubBookings();
      unsubTickets();
    };
  }, [currentUser]);

  // Auth Submit Login or Registration
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");

    if (!authEmail || !authPassword) {
      setAuthError("Forneça e-mail e senha para prosseguir.");
      return;
    }

    try {
      if (authMode === "register") {
        if (!authName) {
          setAuthError("Você deve preencher seu nome completo.");
          return;
        }

        let userObj;
        if (firebaseAvailable) {
          const credentials = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
          userObj = credentials.user;
          await updateProfile(userObj, { displayName: authName });
          await saveUserProfile(userObj.uid, authName, authEmail, authRole);
        } else {
          // Simulator
          userObj = { uid: `sim-${Date.now()}`, email: authEmail, displayName: authName };
        }

        setAuthSuccessMsg("Sua conta VIP foi gerada com sucesso! ✅");
        setCurrentRole(authRole);
        setCurrentUser(userObj);

        await triggerEmailNotification(
          authEmail,
          "Bons Ventos! Conta Criada no MyClubPrime",
          `<h1>Bem-vindo ao ecossistema, ${authName}!</h1><p>Sua credencial de <strong>${authRole}</strong> foi autorizada e gravada no banco de dados.</p>`
        );

        setTimeout(() => {
          setAuthModalOpen(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthName("");
        }, 1500);

      } else {
        // Login mode
        let loggedUser;
        if (firebaseAvailable) {
          const credentials = await signInWithEmailAndPassword(auth, authEmail, authPassword);
          loggedUser = credentials.user;
          const profile: any = await fetchUserProfile(loggedUser.uid);
          if (profile?.role) {
            setCurrentRole(profile.role as UserRole);
          }
        } else {
          // local match simulated
          loggedUser = { uid: "sim-levi-123", email: authEmail, displayName: "Levi Gold" };
          setCurrentUser(loggedUser);
          if (authEmail.includes("host") || authEmail.includes("anfitriao")) {
            setCurrentRole(UserRole.HOST);
          } else if (authEmail.includes("admin")) {
            setCurrentRole(UserRole.ADMINISTRATOR);
          } else {
            setCurrentRole(UserRole.GUEST);
          }
        }

        setAuthSuccessMsg("Autenticado com sucesso! Carregando...");

        await triggerEmailNotification(
          authEmail,
          "Alerta de Novo Login - MyClubPrime Security",
          `<p>Detectamos um novo login para a sua conta <strong>${authEmail}</strong> em 2026.</p>`
        );

        setTimeout(() => {
          setAuthModalOpen(false);
          setAuthEmail("");
          setAuthPassword("");
        }, 1000);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Erro na autenticação. Verifique os dados.");
    }
  };

  const handleSignOut = async () => {
    if (firebaseAvailable) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setCurrentRole(UserRole.GUEST);
  };

  // AI Assistant Chat Suggestion State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Checkout Interactive States
  const [checkoutBookingProperty, setCheckoutBookingProperty] = useState<Property | null>(null);
  const [checkoutCheckIn, setCheckoutCheckIn] = useState<string>("2026-06-15");
  const [checkoutCheckOut, setCheckoutCheckOut] = useState<string>("2026-06-20");
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"PIX" | "Credit Card" | "USDT Polygon">("USDT Polygon");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [newBookingAuditStamp, setNewBookingAuditStamp] = useState<string>("");

  // Review System
  const [userReviewName, setUserReviewName] = useState<string>("");
  const [userReviewRating, setUserReviewRating] = useState<number>(5);
  const [userReviewComment, setUserReviewComment] = useState<string>("");
  const [reviewsList, setReviewsList] = useState<Array<{name: string, rating: number, comment: string, date: string}>>([
    { name: "Michael Chen", rating: 5, comment: "Absolutely mind-blowing ocean access. The glass pool edge feels magical.", date: "May 12, 2026" },
  ]);

  // Handle AI Recommendation click
  const handleAiAsk = () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse("");
    setTimeout(() => {
      const pText = aiPrompt.toLowerCase();
      let matchProp = masterProperties[0];
      let answer = "";

      if (pText.includes("kite") || pText.includes("wind") || pText.includes("cumbuco")) {
        matchProp = masterProperties[1];
        answer = `I highly recommend the **${matchProp.name}** in Cumbuco. It has dedicated kite launching docks, direct beachfront winds, and high-speed Starlink. It's listed at $${matchProp.pricePerNightUSD}/night and currently holds a ${matchProp.rating} rating.`;
      } else if (pText.includes("skyline") || pText.includes("city") || pText.includes("fortaleza") || pText.includes("penthouse")) {
        matchProp = masterProperties[2];
        answer = `The **${matchProp.name}** in Fortaleza is perfect for your needs. Located at the 38th skyline tier overlooking Beira Mar beach, it features custom infinity LED pools, soundproof layouts, and VIP team access.`;
      } else if (pText.includes("pet") || pText.includes("rustic") || pText.includes("prea")) {
        matchProp = masterProperties[3];
        answer = `Check out the gorgeous **${matchProp.name}** in Preá. It's rustic, features dynamic solar structures, and provides an open sand play space that is fully Pet Friendly!`;
      } else {
        matchProp = masterProperties[0];
        answer = `The elite choice of Ceará is our signature resort: **${matchProp.name}** in Jericoacoara. It holds an absolute ${matchProp.rating} rating and features private glass infinity pools overlooking the beachfront sunset dunes.`;
      }

      setAiResponse(answer);
      setSelectedProperty(matchProp);
      setIsAiLoading(false);
    }, 1000);
  };

  // Checkout Calculator
  const calculateFees = (prop: Property) => {
    const nights = 4; // demo static calculation
    const base = prop.pricePerNightUSD * nights;
    const taxes = Math.round(base * 0.08);
    const serviceFeePercent = checkoutPaymentMethod === "USDT Polygon" ? 0.001 : 0.035;
    const dynamicFees = Math.round(base * serviceFeePercent);
    const finalAmount = base + taxes + dynamicFees;
    const bankSurchargeSaved = checkoutPaymentMethod === "USDT Polygon" ? Math.round(base * 0.034) : 0;
    return { base, taxes, dynamicFees, finalAmount, bankSurchargeSaved, nights };
  };

  // Checkout Execution
  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutBookingProperty || !termsAccepted) return;

    setIsProcessingCheckout(true);
    const calculated = calculateFees(checkoutBookingProperty);
    const randomId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const contractStamp = `poly_0x${Math.random().toString(16).substr(2, 40)}`;

    const newReservation: Booking = {
      id: randomId,
      propertyId: checkoutBookingProperty.id,
      propertyName: checkoutBookingProperty.name,
      propertyImage: checkoutBookingProperty.imageUrl,
      guestId: currentUser?.uid || "guest-levi-01",
      guestName: currentUser?.displayName || "Levi Gold",
      hostId: checkoutBookingProperty.hostId,
      checkIn: checkoutCheckIn,
      checkOut: checkoutCheckOut,
      totalAmountUSD: calculated.finalAmount,
      totalAmountFiatBRL: Math.round(calculated.finalAmount * 5.2),
      paymentMethod: checkoutPaymentMethod,
      paymentStatus: checkoutPaymentMethod === "PIX" ? "Pending" : (checkoutPaymentMethod === "USDT Polygon" ? "Escrow_Locked" : "Paid"),
      escrowStatus: checkoutPaymentMethod === "PIX" ? "Inactive" : (checkoutPaymentMethod === "USDT Polygon" ? "Locked" : "Progressive_Released"),
      securityGuaranteeStamp: contractStamp,
      blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      checkInQrCode: `MYCLUBPRIME-${randomId}`,
      hasActiveDispute: false
    };

    if (checkoutPaymentMethod === "PIX") {
      setMpPixLoading(true);
      try {
        const response = await fetch("/api/mp/pix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: newReservation.totalAmountFiatBRL,
            bookingId: randomId,
            guestEmail: currentUser?.email || "leviethereum@gmail.com"
          })
        });
        const pixRes = await response.json();
        
        // Open Pix Modal with Mercado Pago parameters
        setMpPixData({
          qrCodeUrl: pixRes.qrCodeUrl,
          copyPasteCode: pixRes.copyPasteCode,
          amount: pixRes.amount,
          bookingId: pixRes.bookingId
        });
        
        setMpPixModalOpen(true);
      } catch (err) {
        console.error("Error creating PIX Mercado Pago order:", err);
      } finally {
        setMpPixLoading(false);
        setIsProcessingCheckout(false);
      }
      return;
    }

    // Otherwise, complete card or USDT reservation successfully directly
    await addBookingToDb(newReservation);
    setBookings(prev => [newReservation, ...prev]);
    setNewBookingAuditStamp(contractStamp);
    setCheckoutSuccess(true);
    setIsProcessingCheckout(false);

    await triggerEmailNotification(
      currentUser?.email || "leviethereum@gmail.com",
      "Confirmação de Reserva de Luxo - MyClubPrime Escrow",
      `<h1>Sua hospedagem VIP está confirmada!</h1><p>Vila: <strong>${checkoutBookingProperty.name}</strong></p><p>Check-in: ${checkoutCheckIn} e Check-out: ${checkoutCheckOut}</p><p>O valor de <strong>$${calculated.finalAmount} USD</strong> está guardado sob a custódia MyClubPrime Legal Escrow e será progressivamente repassado ao proprietário.</p>`
    );

    // Scroll to dashboards so user can instantly see their booking
    setTimeout(() => {
      const dashboardElement = document.getElementById("dashboards-section");
      if (dashboardElement) {
        dashboardElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 1000);
  };

  const handleConfirmPixPayment = async () => {
    if (!mpPixData || !checkoutBookingProperty) return;
    
    // Create actual reservation item
    const randomId = mpPixData.bookingId;
    const contractStamp = `poly_0x${Math.random().toString(16).substr(2, 40)}`;

    const paidReservation: Booking = {
      id: randomId,
      propertyId: checkoutBookingProperty.id,
      propertyName: checkoutBookingProperty.name,
      propertyImage: checkoutBookingProperty.imageUrl,
      guestId: currentUser?.uid || "guest-levi-01",
      guestName: currentUser?.displayName || "Levi Gold",
      hostId: checkoutBookingProperty.hostId,
      checkIn: checkoutCheckIn,
      checkOut: checkoutCheckOut,
      totalAmountUSD: checkoutBookingProperty.pricePerNightUSD * 5, // Estimated nights
      totalAmountFiatBRL: mpPixData.amount,
      paymentMethod: "PIX",
      paymentStatus: "Paid",
      escrowStatus: "Locked", // becomes locked in escrow for safety
      securityGuaranteeStamp: contractStamp,
      blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      checkInQrCode: `MYCLUBPRIME-${randomId}`,
      hasActiveDispute: false
    };

    await addBookingToDb(paidReservation);
    setBookings(prev => [paidReservation, ...prev]);
    setNewBookingAuditStamp(contractStamp);
    setMpPixModalOpen(false);
    setCheckoutSuccess(true);

    await triggerEmailNotification(
      currentUser?.email || "leviethereum@gmail.com",
      "Pagamento PIX Confirmado! - MyClubPrime Escrow",
      `<h1>Mercado Pago PIX Recebido de R$ ${mpPixData.amount} BRL!</h1><h2>Sua hospedagem em ${checkoutBookingProperty.name} está garantida com cobertura de 1.5M USDT de proteção financeira.</h2><p>Código da Reserva: ${randomId}</p>`
    );

    setTimeout(() => {
      const dashboardElement = document.getElementById("dashboards-section");
      if (dashboardElement) {
        dashboardElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 1000);
  };

  // Submit Review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReviewName.trim() || !userReviewComment.trim()) return;

    setReviewsList(prev => [
      {
        name: userReviewName,
        rating: userReviewRating,
        comment: userReviewComment,
        date: "June 01, 2026"
      },
      ...prev
    ]);
    setSelectedProperty(prev => ({
      ...prev,
      reviewsCount: prev.reviewsCount + 1
    }));
    setUserReviewName("");
    setUserReviewComment("");
  };

  // Filter Properties based on Search and Pills
  const filteredProperties = masterProperties.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || 
                          p.location.toLowerCase().includes(query) || 
                          p.region.toLowerCase().includes(query) ||
                          p.description.toLowerCase().includes(query);
    const matchesRegion = regionFilter === "All" || p.region === regionFilter;
    const matchesBeachfront = !filterBeachfront || p.isBeachfront;
    const matchesLuxury = !filterLuxury || p.isLuxury;
    const matchesPool = !filterPool || p.hasPool;
    const matchesPet = !filterPetFriendly || p.isPetFriendly;

    return matchesSearch && matchesRegion && matchesBeachfront && matchesLuxury && matchesPool && matchesPet;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-ocean relative font-sans selection:bg-turquoise selection:text-white" id="main-view-container">
      {/* Decorative ambient glowing fluid orbs simulating Apple Vision Pro / Glassmorphic background */}
      <div className="absolute top-10 left-[10%] w-[320px] h-[320px] rounded-full bg-turquoise/15 glow-orb"></div>
      <div className="absolute top-48 right-[15%] w-[450px] h-[450px] rounded-full bg-gold/10 glow-orb"></div>
      <div className="absolute bottom-[30%] left-[5%] w-[380px] h-[380px] rounded-full bg-blue-500/10 glow-orb"></div>

      {/* ------------------ NAVIGATION DECK ------------------ */}
      <nav className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & handle */}
          <div className="flex items-center gap-2.5">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-tr from-ocean to-turquoise flex items-center justify-center text-white font-extrabold shadow-md transform hover:rotate-12 transition-transform">
              M
            </span>
            <div>
              <h1 className="text-xl font-black font-display tracking-tight text-ocean flex items-center gap-1.5 leading-none">
                MyClubPrime
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] py-0.5 px-1.5 bg-gold/10 border border-gold/20 rounded">ENTERPRISE</span>
              </h1>
              <span className="text-[10px] text-turquoise font-bold font-mono tracking-wider">@myclubprime</span>
            </div>
          </div>

          {/* Quick Stats Scroll ticker */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500 bg-white/40 p-1.5 px-4 rounded-full border border-white/50 shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-turquoise animate-pulse"></span>
              <span>Reserve Vault: <strong className="font-mono text-ocean">1,500,000 USDT</strong></span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div>
              <span>Escrow Capacity: <strong className="font-mono text-ocean">4 Properties OK</strong></span>
            </div>
          </div>

          {/* Role Changer & VIP Login Dock */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/95 p-1.5 rounded-full border border-white/50 shadow-md">
              <span className="text-[9px] font-bold text-gray-400 pl-2 uppercase font-mono">Profile Switch:</span>
              <div className="flex gap-1">
                {(["Guest", "Host", "Creator", "Concierge", "Administrator"] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      currentRole === role
                        ? "bg-gradient-to-r from-ocean to-[#0E356A] text-white shadow-sm scale-105"
                        : "text-gray-500 hover:text-ocean hover:bg-slate-150"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification and Authentication commands */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEmailLogsOpen(true)}
                className="p-2 rounded-xl bg-white/85 text-ocean border border-white/40 hover:bg-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm relative cursor-pointer"
                title="Servidor de Logs de Notificações Enviadas"
              >
                <HelpCircle className="h-4.5 w-4.5 text-turquoise" />
                {activeOutboundEmails.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {activeOutboundEmails.length}
                  </span>
                )}
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2 bg-ocean/10 border border-ocean/20 p-1 pr-2.5 rounded-full shadow-inner">
                  <span className="h-6.5 w-6.5 rounded-full bg-ocean text-white text-[10px] flex items-center justify-center font-bold font-display uppercase">
                    {currentUser.displayName ? currentUser.displayName.charAt(0) : "U"}
                  </span>
                  <div className="text-left text-[10px] hidden sm:block max-w-[100px] truncate">
                    <p className="font-bold text-ocean leading-tight">{currentUser.displayName || "VIP Member"}</p>
                    <p className="text-gray-400 leading-none text-[8px] truncate">{currentUser.email}</p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 underline focus:outline-none ml-1 bg-transparent border-0 cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-turquoise to-[#0dad9b] hover:from-[#0dad9b] hover:to-turquoise text-white text-[11px] font-bold rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
                >
                  Acesso VIP
                </button>
              )}
            </div>
          </div>

        </div>
      </nav>

      {/* ------------------ HERO PLATINUM SECTION ------------------ */}
      <header className="relative py-20 px-6 max-w-7xl mx-auto text-center" id="hero-element-view">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/60 border border-white/40 shadow-sm text-xs text-ocean font-bold tracking-wider">
            <Sparkle className="h-4 w-4 text-gold fill-gold text-gold" />
            CEARÁ RESORT ECOSYSTEM CONNECTIVITY [BETA RELEASE]
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-ocean leading-tight tracking-tight font-display">
            Reserve Premium Properties With <span className="bg-gradient-to-r from-turquoise to-[#0dad9b] bg-clip-text text-transparent">Financial Protection</span>
          </h2>
          
          <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-2xl mx-auto">
            A new hospitality ecosystem combining immersive virtual tours, verified hosts, custom creator storytelling, and decentralized reservation guarantees on the Ceará Coastline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a 
              href="#discovery-section"
              className="px-6 py-3 bg-gradient-to-r from-ocean to-[#0E356A] text-white font-bold rounded-xl text-xs hover:shadow-xl hover:from-[#0E356A] hover:to-[#091e36] hover:scale-105 transition-all flex items-center gap-2"
            >
              Book Now
              <ArrowRight className="h-4 w-4" />
            </a>
            <button 
              onClick={() => {
                setCurrentRole(UserRole.HOST);
                const element = document.getElementById("dashboards-section");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-ocean font-bold rounded-xl text-xs border border-white/80 shadow-md transition-all"
            >
              Become a Host
            </button>
            <a 
              href="#360-tour-anchor"
              className="px-6 py-3 bg-turquoise hover:bg-turquoise/90 text-white font-bold rounded-xl text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Compass className="h-4 w-4" />
              Explore Experiences
            </a>
          </div>
        </div>
      </header>

      {/* ------------------ PROPERTY DISCOVERY & SMART AI ------------------ */}
      <section className="py-12 px-6 max-w-7xl mx-auto space-y-10" id="discovery-section">
        {/* Search header & Filter bar */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-ocean font-display">Property Discovery</h3>
              <p className="text-xs text-gray-500">Find and explore custom 360-degree beachfront estates in Jericoacoara, Cumbuco, and Fortaleza.</p>
            </div>

            {/* Region select filters */}
            <div className="flex flex-wrap gap-2">
              {["All", "Jericoacoara", "Cumbuco", "Fortaleza"].map((region) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    regionFilter === region 
                      ? "bg-ocean text-white shadow-md border border-ocean/30" 
                      : "bg-white text-gray-500 border border-white/50 hover:bg-slate-100"
                  }`}
                >
                  {region === "All" ? "📍 All Ceará" : region}
                </button>
              ))}
            </div>
          </div>

          {/* Liquid Glass Filtering Dashboard */}
          <div className="liquid-glass p-5 rounded-2xl border border-white/50 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Input Search text */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-3 text-gray-400 h-4.5 w-4.5" />
              <input 
                type="text" 
                placeholder="Search beach keys, villas, coordinates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 bg-white/70 backdrop-blur-md rounded-xl border border-white/40 focus:outline-none focus:bg-white focus:border-turquoise transition-all font-medium"
              />
            </div>

            {/* Structured amenities pill tags */}
            <div className="md:col-span-7 flex flex-wrap gap-2.5 items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Parameters:</span>
              
              <button 
                onClick={() => setFilterBeachfront(!filterBeachfront)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterBeachfront ? "bg-turquoise/20 text-turquoise border border-turquoise/30" : "bg-white/50 text-gray-500 border border-white/40"
                }`}
              >
                🌊 Beachfront
              </button>

              <button 
                onClick={() => setFilterLuxury(!filterLuxury)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterLuxury ? "bg-turquoise/20 text-turquoise border border-turquoise/30" : "bg-white/50 text-gray-500 border border-white/40"
                }`}
              >
                💎 Luxury Luxe
              </button>

              <button 
                onClick={() => setFilterPool(!filterPool)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterPool ? "bg-turquoise/20 text-turquoise border border-turquoise/30" : "bg-white/50 text-gray-500 border border-white/40"
                }`}
              >
                🏊 Private Pool
              </button>

              <button 
                onClick={() => setFilterPetFriendly(!filterPetFriendly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterPetFriendly ? "bg-turquoise/20 text-turquoise border border-turquoise/30" : "bg-white/50 text-gray-500 border border-white/40"
                }`}
              >
                🐾 Pet Friendly
              </button>
            </div>

          </div>
        </div>

        {/* ------------------ SMART ARTIFICIAL INTELLIGENCE SUGGESTIONS ------------------ */}
        <div className="liquid-glass p-6 rounded-2xl border border-turquoise/25 bg-gradient-to-r from-white/90 to-turquoise/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 px-2.5 bg-turquoise/10 text-turquoise rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center gap-1 font-mono">
              <Sparkles className="h-3 w-3 fill-turquoise text-turquoise" />
              INTELLIGENT RECO-ENGINE
            </span>
            <p className="text-xs text-gray-500">State your vacation criteria for smart matching</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="e.g. Find me a luxury beachfront estate in Jericoacoara with starlink and veranda pool..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiAsk(); }}
              className="flex-1 text-xs px-3 py-3 bg-white rounded-xl border border-gray-150 focus:outline-none focus:border-turquoise"
            />
            <button
              onClick={handleAiAsk}
              disabled={isAiLoading}
              className="px-5 py-3 bg-ocean text-white font-bold rounded-xl text-xs hover:bg-[#0E356A] transition-all whitespace-nowrap"
            >
              {isAiLoading ? "Consulting Ledgers..." : "Ask AI Engine"}
            </button>
          </div>

          {aiResponse && (
            <div className="mt-4 p-4 bg-white/70 border border-white/40 rounded-xl text-xs leading-relaxed text-gray-700">
              <p className="font-bold text-ocean italic mb-1">AI Recommendation Feedback:</p>
              {aiResponse}
            </div>
          )}
        </div>

        {/* Property Grid items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              ❌ No premium estates match your specific search criteria. Refine filters.
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <div 
                key={prop.id}
                onClick={() => {
                  setSelectedProperty(prop);
                  const el = document.getElementById("active-property-view");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group liquid-glass p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer ${
                  selectedProperty.id === prop.id ? "border-turquoise shadow-lg" : "border-white/40"
                }`}
              >
                {/* Image panel */}
                <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3">
                  <img 
                    src={prop.imageUrl} 
                    alt={prop.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  {prop.isLuxury && (
                    <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-ocean text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-yellow-200">
                      LUXE PLATINUM
                    </span>
                  )}
                  {prop.has360Tour && (
                    <span className="absolute top-2.5 right-2.5 bg-turquoise text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: "12s" }} />
                      360 TOUR
                    </span>
                  )}
                </div>

                {/* Info Text */}
                <span className="text-[10px] text-turquoise uppercase font-bold tracking-wider">{prop.region} Coastline</span>
                <h4 className="font-bold text-ocean font-display mt-0.5 text-base truncate group-hover:text-turquoise transition-colors">{prop.name}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{prop.tagline}</p>
                
                <div className="flex gap-2 text-[10px] text-gray-400 mt-2 pb-3 border-b border-gray-100">
                  <span>🛌 {prop.bedrooms} Bed</span>
                  <span>•</span>
                  <span>🚿 {prop.bathrooms} Bath</span>
                  <span>•</span>
                  <span>👥 {prop.maxGuests} Guests</span>
                </div>

                <div className="flex justify-between items-center pt-3 mt-1">
                  <div>
                    <span className="text-xs text-gray-400">Nightly Rate</span>
                    <p className="text-sm font-black text-ocean font-mono">${prop.pricePerNightUSD} USD</p>
                  </div>
                  <span className="text-xs font-bold text-turquoise bg-turquoise/5 px-2.5 py-1 rounded-lg border border-turquoise/15 font-mono">
                    {prop.pricePerNightUSDT} USDT
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ------------------ ACTIVE PROPERTY DETAILED PANEL ------------------ */}
      <section className="bg-slate-100/50 py-16 border-y border-slate-200/65" id="active-property-view">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-turquoise/10 text-turquoise rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                  ACTIVE PROPERTY ANALYSIS
                </span>
                <span className="text-xs text-[#d4af37] font-semibold">★ {selectedProperty.rating} ({selectedProperty.reviewsCount} reviews)</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-ocean tracking-tight font-display mt-2">
                {selectedProperty.name}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-sans">
                <MapPin className="h-4 w-4 text-turquoise" />
                {selectedProperty.location}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {selectedProperty.isBeachfront && <span className="bg-white px-3 py-1.5 rounded-lg text-ocean border shadow-sm font-bold">🌊 Beachfront Access</span>}
              {selectedProperty.hasPool && <span className="bg-white px-3 py-1.5 rounded-lg text-ocean border shadow-sm font-bold">🏊 Infinity Pool</span>}
              {selectedProperty.isPetFriendly && <span className="bg-white px-3 py-1.5 rounded-lg text-ocean border shadow-sm font-bold">🐾 Pet Friendly</span>}
              {selectedProperty.isRemoteWorkFriendly && <span className="bg-white px-3 py-1.5 rounded-lg text-ocean border shadow-sm font-bold">📡 High-Speed Starlink</span>}
            </div>
          </div>

          {/* Master 360 Embedded Tour Section */}
          <div className="space-y-4" id="360-tour-anchor">
            <h3 className="font-display font-semibold text-lg text-ocean">Embedded Immersive 360° virtual Tour</h3>
            <VirtualTour 
              property={selectedProperty} 
              onBookNow={() => {
                setCheckoutBookingProperty(selectedProperty);
                const el = document.getElementById("checkout-reservation-form");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
            />
          </div>

          {/* Details Bento Row - description, amenities AND checkout selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* Left: About & Amenities */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <h4 className="font-display font-bold text-lg text-ocean pb-3 border-b border-gray-100">About active estate</h4>
                <p className="text-xs text-gray-650 leading-relaxed font-sans">{selectedProperty.description}</p>
              </div>

              {/* Amenities Grid */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h4 className="font-display font-bold text-lg text-ocean pb-3 border-b border-gray-100 mb-4">Premium Amenities Included</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedProperty.amenities.map((am, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-turquoise text-sm">✔</span>
                      <span className="font-medium">{am}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Submissions Component */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h4 className="font-display font-bold text-lg text-ocean pb-3 border-b border-gray-100 mb-4">Property Audit Reviews</h4>
                
                {/* Form to add critical reviews */}
                <form onSubmit={handleAddReview} className="space-y-4 mb-8 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                  <p className="text-xs font-bold text-ocean">Submit physical validation or review comments</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">Your Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Levi Gold"
                        value={userReviewName}
                        onChange={(e) => setUserReviewName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold mb-1">Rating Value</label>
                      <select 
                        value={userReviewRating} 
                        onChange={(e) => setUserReviewRating(Number(e.target.value))} 
                        className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                      >
                        <option value={5}>★★★★★ (Excellent)</option>
                        <option value={4}>★★★★☆ (Good)</option>
                        <option value={3}>★★★☆☆ (Mediocre)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 font-bold mb-1">Detailed Review Comment</label>
                    <textarea 
                      rows={2} 
                      placeholder="Comment on space accuracy, water, wind state..."
                      value={userReviewComment}
                      onChange={(e) => setUserReviewComment(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-ocean hover:bg-[#0E356A] text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Post Certified Review
                  </button>
                </form>

                {/* Render Reviews List */}
                <div className="space-y-4">
                  {reviewsList.map((rev, idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="text-xs text-ocean">{rev.name}</strong>
                          <span className="text-[10px] text-yellow-500 font-bold ml-2">{"★".repeat(rev.rating)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 italic font-sans">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Reservation checkout process */}
            <div className="lg:col-span-4 space-y-6" id="checkout-reservation-form">
              <div className="liquid-glass p-6 rounded-2xl border border-white/50 space-y-5">
                <div className="pb-3 border-b border-gray-150">
                  <h4 className="text-base font-black text-ocean font-display">Contract Reservation Block</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Dual signature instant escrow system</p>
                </div>

                <form onSubmit={handleExecuteCheckout} className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500 font-bold">📅 Select Stay Dates (5-day standard block)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold">Check-In</p>
                        <input 
                          type="date" 
                          value={checkoutCheckIn}
                          onChange={(e) => setCheckoutCheckIn(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/70 border border-gray-200 rounded focus:outline-none focus:border-turquoise" 
                        />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold">Check-Out</p>
                        <input 
                          type="date" 
                          value={checkoutCheckOut}
                          onChange={(e) => setCheckoutCheckOut(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white/70 border border-gray-200 rounded focus:outline-none focus:border-turquoise" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500 font-bold">🏦 Choose Payout / Guarantee Method</label>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod("USDT Polygon")}
                        className={`p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                          checkoutPaymentMethod === "USDT Polygon" 
                            ? "bg-turquoise/10 border-turquoise shadow-sm font-semibold text-ocean" 
                            : "bg-white/50 border-gray-100 text-gray-500 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Coins className="h-4.5 w-4.5 text-turquoise" />
                          <div>
                            <p className="font-bold text-xs text-ocean">USDT Polygon Smart Contract</p>
                            <p className="text-[9px] text-gray-400">Escrow locked, 0.1% transaction fee</p>
                          </div>
                        </div>
                        <span className="text-white text-[10px] bg-turquoise px-1.5 py-0.5 rounded font-mono font-bold">RECOMMENDED</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod("PIX")}
                        className={`p-3 rounded-xl text-left border flex items-center gap-2 transition-all ${
                          checkoutPaymentMethod === "PIX" 
                            ? "bg-turquoise/10 border-turquoise shadow-sm font-semibold text-ocean" 
                            : "bg-white/50 border-gray-100 text-gray-500 hover:bg-white"
                        }`}
                      >
                        <span className="font-bold text-turquoise text-lg leading-none">⚡</span>
                        <div>
                          <p className="font-bold text-xs text-ocean">PIX Central Bank Brazil</p>
                          <p className="text-[9px] text-gray-400">Locked via virtual Pix-Escrow keys</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod("Credit Card")}
                        className={`p-3 rounded-xl text-left border flex items-center gap-2 transition-all ${
                          checkoutPaymentMethod === "Credit Card" 
                            ? "bg-turquoise/10 border-turquoise shadow-sm font-semibold text-ocean" 
                            : "bg-white/50 border-gray-200 text-gray-500 hover:bg-white"
                        }`}
                      >
                        <CreditCard className="h-4.5 w-4.5 text-gray-400" />
                        <div>
                          <p className="font-bold text-xs text-ocean">International Credit Card</p>
                          <p className="text-[9px] text-gray-400">Standard banking gateway, 3.5% fee</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Comparison Panel */}
                  <div className="p-4 bg-white/60 border border-white/40 rounded-xl space-y-2 mt-4 text-xs">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Financial Summary</p>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Cost (4 nights)</span>
                      <span className="font-semibold text-ocean">${calculateFees(selectedProperty).base} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Taxes</span>
                      <span className="font-semibold text-ocean">${calculateFees(selectedProperty).taxes} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gateway Transaction Fee</span>
                      <span className="font-semibold text-ocean">${calculateFees(selectedProperty).dynamicFees} USD</span>
                    </div>
                    
                    {checkoutPaymentMethod === "USDT Polygon" && (
                      <div className="bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded-lg font-bold border border-emerald-100 text-center">
                        🎉 USDT payment advantage saved you ${calculateFees(selectedProperty).bankSurchargeSaved} USD in credit surcharges!
                      </div>
                    )}

                    <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm">
                      <span className="text-ocean font-display">Target Payout Contract</span>
                      <span className="text-turquoise font-mono">${calculateFees(selectedProperty).finalAmount} USD</span>
                    </div>
                  </div>

                  {/* Terms acceptance and on-chain signature */}
                  <div className="flex gap-2 items-start mt-4 bg-white p-3 border border-gray-100 rounded-lg">
                    <input 
                      type="checkbox" 
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded focus:ring-turquoise accent-turquoise cursor-pointer h-4 w-4" 
                    />
                    <label htmlFor="terms-checkbox" className="text-[10px] tracking-wide leading-relaxed text-gray-550 select-none cursor-pointer">
                      <strong>Required:</strong> I accept the <strong>MyClubPrime Digital Booking Agreement</strong>, confirming lockup of escrow assets until check-in.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!termsAccepted || isProcessingCheckout}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all ${
                      termsAccepted && !isProcessingCheckout
                        ? "bg-gradient-to-r from-ocean to-[#0E356A] hover:shadow-xl hover:scale-[1.01] text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isProcessingCheckout ? (
                      <span className="flex items-center gap-2 font-mono">
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                        PROCESSING LEDGER TRUST LOCK...
                      </span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Authorize Escape Lock-up
                      </>
                    )}
                  </button>
                </form>

                {checkoutSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1 text-xs animate-fade-in">
                    <p className="font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="h-4.5 w-4.5" /> Space Allocation Authorized!
                    </p>
                    <p className="text-[10px] leading-relaxed">
                      Your fund allocation is safely locked inside the <strong className="font-mono text-ocean">EnterpriseEscrow</strong> contract under stamp hash key:
                    </p>
                    <div className="bg-white/60 p-1 rounded font-mono text-[9px] select-all break-all border border-emerald-100 text-center">
                      {newBookingAuditStamp}
                    </div>
                    <p className="text-[9px] italic text-[#d4af37] font-bold text-center mt-1">
                      Verification QR added instantly to your Guest Dashboard below!
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------ RESERVATION PROTECTION VISUAL SECTION ------------------ */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex gap-1 items-center px-3 py-1 bg-turquoise/10 text-turquoise rounded-full text-[11px] font-extrabold uppercase font-mono tracking-wider">
            <ShieldCheck className="h-4 w-4 fill-turquoise text-turquoise" />
            Immutable Reserve Protection protocol
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-ocean font-display">
            Your Reservation Is Protected
          </h2>
          <p className="text-xs text-gray-500 max-w-xl mx-auto">
            MyClubPrime implements automated timelocks and decentralized escrow bounds ensuring complete transparency, security, and dispute arbitrations for guests and hosts.
          </p>
        </div>

        {/* Animated Flow chart steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          
          <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm text-center space-y-2">
            <span className="h-7 w-7 rounded-full bg-turquoise/10 text-turquoise flex items-center justify-center font-mono font-bold text-xs mx-auto">01</span>
            <h4 className="font-bold text-ocean text-xs font-display">Reservation Initiated</h4>
            <p className="text-[10px] text-gray-400">Guest specifies season dates and commits payment on-chain.</p>
          </div>

          <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm text-center space-y-2">
            <span className="h-7 w-7 rounded-full bg-turquoise/10 text-turquoise flex items-center justify-center font-mono font-bold text-xs mx-auto">02</span>
            <h4 className="font-bold text-ocean text-xs font-display">Digital Agreement</h4>
            <p className="text-[10px] text-gray-400">HostTermsRegistry creates legal version binding IPFS constraints.</p>
          </div>

          <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm text-center space-y-2">
            <span className="h-7 w-7 rounded-full bg-turquoise/10 text-turquoise flex items-center justify-center font-mono font-bold text-xs mx-auto">03</span>
            <h4 className="font-bold text-ocean text-xs font-display">Protected Guarantee</h4>
            <p className="text-[10px] text-gray-400">Vault registers up to 50% payout backing should cancellation occur.</p>
          </div>

          <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm text-center space-y-2">
            <span className="h-7 w-7 rounded-full bg-turquoise/10 text-turquoise flex items-center justify-center font-mono font-bold text-xs mx-auto">04</span>
            <h4 className="font-bold text-ocean text-xs font-display">Check-In Validation</h4>
            <p className="text-[10px] text-gray-400">QR clearance validation triggers release commands to the nodes.</p>
          </div>

          <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm text-center space-y-2">
            <span className="h-7 w-7 rounded-full bg-turquoise/10 text-turquoise flex items-center justify-center font-mono font-bold text-xs mx-auto">05</span>
            <h4 className="font-bold text-ocean text-xs font-display">Secure Release</h4>
            <p className="text-[10px] text-gray-400">Assets are progressively distributed onto available claim parameters.</p>
          </div>

        </div>

        {/* Benefits lists cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="liquid-glass p-6 rounded-2xl border border-white/50 text-left space-y-2">
            <h4 className="font-bold text-ocean text-sm">Dispute Resolution Guarantee</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Concierge arbitration holds funds whenever a dispute is formally submitted. Fast, objective mediation assures client lock-up security at all times.
            </p>
          </div>

          <div className="liquid-glass p-6 rounded-2xl border border-white/50 text-left space-y-2">
            <h4 className="font-bold text-ocean text-sm">Immutable Digital Audit</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              No central agency can overwrite terms. Digital legal versions and telemetry actions register in public IPFS hashes forever.
            </p>
          </div>

          <div className="liquid-glass p-6 rounded-2xl border border-white/50 text-left space-y-2">
            <h4 className="font-bold text-ocean text-sm">Verified Host Network</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Each landlord holds prime score verification and physical infrastructure reviews prior to listing permission validation. Highly trustable.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------ ROLE DASHBOARDS INTERACTIVE AREA ------------------ */}
      <section className="bg-slate-900 text-white py-20 border-t-2 border-turquoise" id="dashboards-section">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-extrabold font-display leading-tight">Interactive Protocol Board</h2>
              <p className="text-xs text-slate-400">Switches roles to audit bookings, manage listings, and monitor smart contract escrow reserves on-the-fly.</p>
            </div>

            {/* Quick action button within dashboard header context */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Current Identity:</span>
              <span className="bg-[#0b1b3d] text-turquoise text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-turquoise/30">
                {currentRole} Status Active
              </span>
            </div>
          </div>

          {/* Sub-components renderer */}
          <RoleDashboards 
            currentRole={currentRole}
            properties={properties}
            bookings={bookings}
            setBookings={setBookings}
            campaigns={mockCreatorCampaigns}
            tickets={tickets}
            setTickets={setTickets}
            legalRegistry={legalRegistry}
            setLegalRegistry={setLegalRegistry}
            activeEmail={currentUser?.email || "leviethereum@gmail.com"}
          />

        </div>
      </section>

      {/* ------------------ FOOTER METRICS ------------------ */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-center items-center gap-3 text-white">
            <span className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold">M</span>
            <span className="font-display font-black tracking-tight text-lg">MyClubPrime Enterprise</span>
          </div>

          <p className="text-[11px] leading-relaxed max-w-xl mx-auto text-slate-500">
            A secure luxury decentralized hospitality ecosystem. Immersive 360 virtual tours, direct bookings, referral marketing UTM nodes, digital trust legal version audits, and blockchain escrow guarantees for target Jericoacoara, Cumbuco, and Fortaleza coastal destinations.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-slate-600 font-mono text-[10px]">
            <span>IPFS Audit: QmXoypizjW3WknFiJnKL...</span>
            <span>•</span>
            <span>Sovereign Reserve capacity: 1,500,000 USDT [OK]</span>
            <span>•</span>
            <span>Standard Time: June 2026</span>
          </div>

          <p className="text-[10px] text-slate-700">
            © 2026 MyClubPrime. All right reserve. Decentralized terms version 2.4-ESCRW active.
          </p>
        </div>
      </footer>

      {/* ==================== 1. FIREBASE AUTH MODAL ==================== */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md bg-slate-950/40">
          <div className="liquid-glass border border-white/50 p-7 rounded-3xl w-full max-w-md text-ocean space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-ocean text-sm font-bold bg-white/50 h-8 w-8 rounded-full flex items-center justify-center border border-white/60 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-[9px] font-black tracking-widest text-[#d4af37] bg-gold/10 px-2 py-1 rounded border border-gold/20 uppercase">
                Acesso VIP MyClubPrime
              </span>
              <h3 className="font-display font-bold text-2xl text-ocean mt-2">
                {authMode === "login" ? "Entrar na sua Conta" : "Criar Credencial de Membro"}
              </h3>
              <p className="text-xs text-gray-500">Acesse ou registre-se na infraestrutura operacional de turismo premium.</p>
            </div>

            {authError && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-1.5 font-sans">
                <AlertCircle className="h-4 w-4" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authMode === "register" && (
                <div>
                  <label className="block text-[10px] font-bold text-ocean uppercase mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Levi Goldstein" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-ocean uppercase mb-1">E-mail Corporativo o Pessoal *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="Ex: leviethereum@gmail.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ocean uppercase mb-1">Senha de Acesso VIP *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••••••••" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-turquoise"
                />
              </div>

              {authMode === "register" && (
                <div>
                  <label className="block text-[10px] font-bold text-ocean uppercase mb-2">Perfil de Conectividade *</label>
                  <div className="grid grid-cols-2 gap-3 text-center text-[11px]">
                    <button 
                      type="button"
                      onClick={() => setAuthRole(UserRole.GUEST)}
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
                        authRole === UserRole.GUEST 
                          ? "bg-ocean text-white border-ocean" 
                          : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                      }`}
                    >
                      ✈️ Hóspede VIP
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAuthRole(UserRole.HOST)}
                      className={`p-2.5 rounded-xl border font-bold transition-all ${
                        authRole === UserRole.HOST 
                          ? "bg-ocean text-white border-ocean" 
                          : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                      }`}
                    >
                      🏡 Anfitrião Prime
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-ocean to-[#0E356A] text-white hover:opacity-90 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-all shadow-md cursor-pointer mt-2"
              >
                {authMode === "login" ? "Entrar Secretamente" : "Registrar Conta e Cadastrar Perfis"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <button 
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-[11px] text-turquoise font-bold hover:underline bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                {authMode === "login" ? "Não possui conta? Registre-se agora ➜" : "Já é membro cadastrado? Efetue o Login ➜"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. MERCADO PAGO PIX GATEWAY MODAL ==================== */}
      {mpPixModalOpen && mpPixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md bg-slate-950/40">
          <div className="liquid-glass border border-white/50 p-7 rounded-3xl w-full max-w-sm text-ocean space-y-5 shadow-2xl text-center relative">
            <button 
              onClick={() => setMpPixModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-ocean text-sm font-bold bg-white/50 h-8 w-8 rounded-full flex items-center justify-center border border-white/60 cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-block bg-[#009EE3]/15 text-[#009EE3] text-[9px] font-black px-2 py-1.5 rounded uppercase border border-[#009EE3]/25 font-mono">
                MERCADO PAGO PIX PROXY
              </div>
              <h3 className="font-display font-medium text-lg mt-2 text-ocean">Finalize sua Payout-Escrow</h3>
              <p className="text-[11px] text-gray-500 leading-normal">
                Pague o PIX dinâmico abaixo para que seu depósito de custódia seja bloqueado pela MyClubPrime no banco de dados.
              </p>
            </div>

            {/* QR block code */}
            <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mx-auto border border-gray-100">
              <img src={mpPixData.qrCodeUrl} className="w-[180px] h-[180px] object-cover" alt="MP PIX Code" />
            </div>

            {/* Total value indicators */}
            <div className="bg-white/50 p-3 rounded-xl border border-white max-w-xs mx-auto">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Valor Total Solicitado</span>
              <strong className="text-xl font-mono text-ocean font-black">R$ {mpPixData.amount.toLocaleString()} BRL</strong>
              <span className="text-[8px] text-turquoise font-bold block mt-0.5">Sem taxas bancárias externas (PIX garantido)</span>
            </div>

            {/* Pix copy paste string text */}
            <div className="space-y-2 text-left text-xs">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Copia e Cola Pix *</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={mpPixData.copyPasteCode} 
                  className="bg-white/80 p-2 border border-gray-200 rounded-lg text-[9px] font-mono w-full truncate text-ocean focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(mpPixData.copyPasteCode);
                    alert("Copia e Cola copiado para a Área de Transferência!");
                  }}
                  className="px-3 bg-ocean text-white font-bold rounded-lg hover:bg-slate-900 cursor-pointer flex items-center justify-center"
                  title="Copiar Pix"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Confirmation simulator triggers */}
            <button
              onClick={handleConfirmPixPayment}
              className="w-full py-3 bg-[#009EE3] hover:bg-[#007ebb] text-white text-xs font-bold rounded-xl flex justify-center items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Simular Confirmação Pix (Mercado Pago)
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3. EMAIL NOTIFICATIONS SIMULATED MAILBOX ==================== */}
      {emailLogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end backdrop-blur-sm bg-slate-950/20">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between text-xs text-ocean">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-display font-medium text-lg text-ocean flex items-center gap-1.5">
                    <HelpCircle className="h-5 w-5 text-turquoise" />
                    SMTP Outbound Notification Log
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Monitor legal notifications and digital signatures alerts in real-time.</p>
                </div>
                <button 
                  onClick={() => setEmailLogsOpen(false)}
                  className="text-gray-400 hover:text-ocean text-sm font-bold h-8 w-8 rounded-full border bg-slate-50 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Emails loop logs list */}
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {activeOutboundEmails.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="font-mono text-xs">Waiting for outbound server messages...</p>
                    <p className="text-[10px] mt-1 text-gray-300">Register accounts or trigger PIX payments to test transaction alerts.</p>
                  </div>
                ) : (
                  activeOutboundEmails.map((ml, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-gray-150 space-y-1.5 relative hover:border-turquoise/30 transition-all">
                      <span className="absolute top-2.5 right-3 text-[8px] font-mono text-gray-400">
                        {new Date(ml.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      <div className="text-[10px]">
                        <span className="font-bold text-turquoise uppercase tracking-wide">Recipient: </span>
                        <strong className="text-ocean">{ml.to}</strong>
                      </div>

                      <div className="font-bold text-xs text-ocean pr-10">Subject: {ml.subject}</div>

                      <div className="p-2.5 bg-white/60 border border-gray-200/50 rounded-lg text-[10px] text-gray-500 overflow-x-auto leading-relaxed max-h-[120px] overflow-y-auto">
                        {/* Safely inject content HTML since it's sandbox safe from our api */}
                        <div dangerouslySetInnerHTML={{ __html: ml.body }} />
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] font-semibold text-emerald-600 pt-0.5 bg-emerald-50 px-2 py-0.5 rounded">
                        <span>● SMTP simulated status</span>
                        <span>{ml.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clear option */}
            <div className="border-t pt-4">
              <button 
                onClick={async () => {
                  alert("No sandbox reset active. Outbound logs reset when development server reboots.");
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-gray-500 font-bold rounded-lg text-center cursor-pointer transition-all"
              >
                Reset Outbound Server Cache
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
