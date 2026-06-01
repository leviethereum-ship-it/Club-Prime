import React, { useState, useRef, useEffect } from "react";
import { 
  RotateCw, 
  MapPin, 
  Compass, 
  Sparkles, 
  Grid, 
  Eye, 
  BookOpen, 
  Zap, 
  Activity, 
  Navigation,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { Property, VirtualHotspot } from "../types";
import { localGuides } from "../data";

interface VirtualTourProps {
  property: Property;
  onBookNow: () => void;
}

export default function VirtualTour({ property, onBookNow }: VirtualTourProps) {
  const [currentView, setCurrentView] = useState<"veranda" | "bedroom" | "suite">("veranda");
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<VirtualHotspot | null>(null);
  const [viewerViews, setViewerViews] = useState<number>(1429);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // View state mock panoramic imagery
  const viewImages = {
    veranda: property.imageUrl,
    bedroom: property.galleryUrls[1] || property.imageUrl,
    suite: property.galleryUrls[2] || property.imageUrl,
  };

  const viewDescriptions = {
    veranda: "Main Panoramic Veranda with custom integrated glass infinity pool.",
    bedroom: "Sunset-facing master suite with pristine wood and glass structural finishes.",
    suite: "Lounge deck showing adjacent modern kitchenette and wind sport gear racks."
  };

  // Hotspots setup
  const hotspots: Record<"veranda" | "bedroom" | "suite", VirtualHotspot[]> = {
    veranda: [
      { id: "v-1", label: "Glass Pool Edge", x: 35, y: 55, description: "Reinforced 3-ply tempered glass framing hanging 3 meters above Jericoacoara sands.", nearbyContext: "Infinity Flow" },
      { id: "v-2", label: "Kite Storage", x: 72, y: 70, description: "Secure carbon fiber drawers with integrated wind speed telemetry monitors.", nearbyContext: "Sports Safe" },
      { id: "v-3", label: "Master Suite Entrance", x: 50, y: 40, description: "Double slide biometric solid oak door leading to main climate suite.", nearbyContext: "Private Suite" }
    ],
    bedroom: [
      { id: "b-1", label: "Starlink Console", x: 20, y: 65, description: "Starlink ground terminal delivering stable 350 Mbps download speed.", nearbyContext: "Work Base" },
      { id: "b-2", label: "Ocean Lookout", x: 60, y: 30, description: "Ultra-clear non-reflective glass showcasing the Ceará sunset.", nearbyContext: "Sunset Arch" }
    ],
    suite: [
      { id: "s-1", label: "Spa & Dry Sauna", x: 45, y: 50, description: "Bespoke sauna lined with aromatic cedarwood.", nearbyContext: "Health Recovery" },
      { id: "s-2", label: "Wine Dispenser", x: 80, y: 60, description: "Temperature programmed for premium Brazilian and Argentine selections.", nearbyContext: "Lounge VIP" }
    ]
  };

  // Auto rotation effect
  useEffect(() => {
    let interval: any;
    if (autoRotate && !isDragging) {
      interval = setInterval(() => {
        setPanOffset((prev) => (prev + 0.1) % 100);
      }, 40);
    }
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Drag listeners for 360 experience
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    setStartX(e.clientX);
    // Convert pixels to simple panning percentage
    setPanOffset((prev) => {
      let newOffset = prev - dx * 0.08;
      if (newOffset < 0) newOffset += 100;
      if (newOffset > 100) newOffset -= 100;
      return newOffset;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fetch guides
  const guideData = localGuides[property.region] || localGuides.Jericoacoara;

  return (
    <div className="w-full flex flex-col gap-6" id="virtual-tour-viewer">
      {/* 360 Window Area */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative h-[480px] w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none border border-white/20 shadow-xl"
        style={{
          backgroundImage: `url(${viewImages[currentView]})`,
          backgroundSize: "cover",
          backgroundPosition: `${panOffset}% center`,
          transition: isDragging ? "none" : "background-position 0.2s cubic-bezier(0.1, 0.8, 0.2, 1)"
        }}
      >
        {/* Layered White Glass Gradient Header inside 360 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/70 border border-white/40 shadow-sm text-xs text-ocean font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-turquoise opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-turquoise"></span>
            </span>
            360° IMMERSIVE INTERACTION
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-full backdrop-blur-md border shadow-sm transition-all duration-300 ${
                autoRotate 
                  ? "bg-turquoise text-white border-turquoise" 
                  : "bg-white/80 text-ocean border-white/40 hover:bg-white"
              }`}
              title="Toggle Auto Rotation"
            >
              <RotateCw className={`h-4 w-4 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "12s" }} />
            </button>
            <div className="flex gap-1.5 backdrop-blur-md bg-white/70 px-3 py-1.5 rounded-full border border-white/40 shadow-sm text-xs font-mono text-ocean">
              <Eye className="h-3.5 w-3.5 text-turquoise" />
              <span>{viewerViews} TOUR ENGAGEMENTS</span>
            </div>
          </div>
        </div>

        {/* View Switches Overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2 z-10">
          {(["veranda", "bedroom", "suite"] as const).map((view) => (
            <button
              key={view}
              onClick={() => {
                setCurrentView(view);
                setViewerViews(prev => prev + 1);
                setActiveHotspot(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize tracking-wide transition-all ${
                currentView === view
                  ? "bg-ocean text-white shadow-md border border-ocean/30"
                  : "bg-white/80 text-ocean border border-white/30 hover:bg-white"
              }`}
            >
              {view} Section
            </button>
          ))}
        </div>

        {/* Floating Interactive hot spots */}
        {hotspots[currentView].map((spot) => {
          // Adjust coordinates slightly by panOffset to mock moving spatial points
          const initialX = spot.x;
          // Loop math helper to scroll hotspots with panoramic wrapping
          let deltaX = (initialX - (panOffset - 50) + 100) % 100;
          if (deltaX < 5 || deltaX > 95) return null; // hide when offscreen/wrapped

          return (
            <div
              key={spot.id}
              className="absolute transition-transform duration-200"
              style={{
                left: `${deltaX}%`,
                top: `${spot.y}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              {/* Hotspot Ring */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(activeHotspot?.id === spot.id ? null : spot);
                  setViewerViews(prev => prev + 2);
                }}
                className="group relative flex items-center justify-center"
              >
                <span className="absolute inline-flex h-8 w-8 rounded-full bg-turquoise/40 animate-ping opacity-60"></span>
                <span className="absolute inline-flex h-12 w-12 rounded-full bg-gold/10 group-hover:bg-gold/20 transition-all"></span>
                <div className="relative h-6 w-6 rounded-full bg-white border-2 border-turquoise flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkle className="h-3 w-3 text-gold fill-gold" />
                </div>

                {/* Micro tooltip label snippet */}
                <span className="absolute top-7 bg-ocean/90 text-white backdrop-blur-md px-2 py-0.5 rounded text-[10px] whitespace-nowrap opacity-75 group-hover:opacity-100 transition-opacity">
                  {spot.label}
                </span>
              </button>
            </div>
          );
        })}

        {/* Hotspot Context Slide Panel */}
        {activeHotspot && (
          <div className="absolute right-4 bottom-4 top-16 w-80 backdrop-blur-xl bg-white/95 rounded-xl border border-white/40 shadow-2xl p-5 flex flex-col justify-between animate-fade-in z-20">
            <div>
              <div className="flex items-center gap-1.5 text-turquoise font-semibold text-xs uppercase tracking-widest mb-1">
                <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "15s" }} />
                <span>HOTSPOT DETAIL</span>
              </div>
              <h4 className="text-ocean font-bold text-lg leading-tight mb-2">
                {activeHotspot.label}
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                {activeHotspot.description}
              </p>
              {activeHotspot.nearbyContext && (
                <div className="mt-4 px-3 py-2 bg-turquoise/10 border border-turquoise/20 rounded-lg flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-turquoise" />
                  <span className="text-[11px] text-ocean/85 font-semibold font-mono">
                    System Node: {activeHotspot.nearbyContext} [OK]
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  onBookNow();
                }}
                className="w-full py-2 bg-gradient-to-r from-ocean to-[#0E356A] text-white rounded-lg text-xs font-bold hover:shadow-lg hover:from-[#0E356A] hover:to-[#091e36] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Book This Estate</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveHotspot(null)}
                className="w-full py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                Dismiss Detail
              </button>
            </div>
          </div>
        )}

        {/* Immersive Tutorial Overlay at launch */}
        <div className="absolute bottom-4 right-4 pointer-events-none bg-black/50 text-white backdrop-blur-md text-[10px] px-2.5 py-1 rounded-md font-mono tracking-wider">
          💡 Drag screen to look around veranda
        </div>
      </div>

      {/* Description & Surrounding Attractions Bento Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: View Description */}
        <div className="md:col-span-7 p-6 rounded-2xl liquid-glass border border-white/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-gold mb-2">
              <Sparkles className="h-4 w-4 fill-gold text-gold" />
              <span className="text-xs font-bold font-display uppercase tracking-widest">Active Scene Insights</span>
            </div>
            <h3 className="text-xl font-bold text-ocean font-display mb-2 capitalize">
              Inside the {currentView}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {viewDescriptions[currentView]} This room integrates seamless, high-tensile glass engineering and natural timbers from Ceará, maintaining safety and climate balance.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <img 
              src={property.hostAvatar} 
              alt={property.hostName} 
              className="h-10 w-10 rounded-full border border-turquoise/30 object-cover" 
            />
            <div>
              <p className="text-xs text-gray-400">Verified Prime Host</p>
              <p className="text-sm font-bold text-ocean">{property.hostName}</p>
            </div>
            <span className="ml-auto bg-gold/10 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/20">
              PRIME AUDITED
            </span>
          </div>
        </div>

        {/* Right: Region Local Guides (Experiences / Attractions / Restaurants) */}
        <div className="md:col-span-5 p-6 rounded-2xl liquid-glass border border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 bg-turquoise/10 rounded-lg text-turquoise">
              <Navigation className="h-4 w-4 fill-turquoise text-turquoise" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-ocean font-display">Nearby Local Highlights</h4>
              <p className="text-[10px] text-gray-500">Concierge curated hotspots in {property.region}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Attractions */}
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Attractions</p>
              <div className="flex flex-col gap-2">
                {guideData.attractions.map((att, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-white/45 p-2 rounded-lg border border-white/30">
                    <span className="text-gray-700 font-medium">{att.name}</span>
                    <span className="text-turquoise font-mono font-semibold">{att.distance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurants */}
            <div className="mt-2">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Seaside Culinary</p>
              <div className="flex flex-col gap-2">
                {guideData.restaurants.map((res, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-white/45 p-2 rounded-lg border border-white/30">
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{res.name}</span>
                      <span className="text-[9px] text-gray-400">{res.cuisine}</span>
                    </div>
                    <span className="text-gray-500 font-mono text-[10px]">{res.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
