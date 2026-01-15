"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Responder {
  id: string;
  type: "fire" | "medical" | "police";
  unit: string;
  status: "available" | "responding" | "on-scene";
  lat: number;
  lng: number;
  destination?: { lat: number; lng: number };
  eta_minutes?: number;
}

interface Incident {
  id: string;
  type: string;
  priority: string;
  location: { lat: number; lng: number };
}

interface NearbyPlace {
  name: string;
  type: string;
  lat: number;
  lng: number;
  distance: number;
}

interface DispatchMapProps {
  responders: Responder[];
  incidents: Incident[];
  nearbyPlaces: NearbyPlace[];
  userLocation: { lat: number; lng: number } | null;
}

// Enhanced marker icons with smooth animations
const createMarkerIcon = (type: string, isResponding: boolean = false) => {
  const colors: Record<string, { bg: string; glow: string; pulse: string }> = {
    fire: { bg: "#f97316", glow: "rgba(249, 115, 22, 0.7)", pulse: "rgba(249, 115, 22, 0.3)" },
    medical: { bg: "#22c55e", glow: "rgba(34, 197, 94, 0.7)", pulse: "rgba(34, 197, 94, 0.3)" },
    police: { bg: "#3b82f6", glow: "rgba(59, 130, 246, 0.7)", pulse: "rgba(59, 130, 246, 0.3)" },
    incident: { bg: "#ef4444", glow: "rgba(239, 68, 68, 0.9)", pulse: "rgba(239, 68, 68, 0.4)" },
    user: { bg: "#06b6d4", glow: "rgba(6, 182, 212, 0.7)", pulse: "rgba(6, 182, 212, 0.3)" },
    nearby: { bg: "#8b5cf6", glow: "rgba(139, 92, 246, 0.6)", pulse: "rgba(139, 92, 246, 0.2)" },
  };

  const color = colors[type] || colors.incident;
  
  // Enhanced pulse animation for responding or incident markers
  const pulseAnimation = isResponding || type === "incident" ? `
    <style>
      @keyframes pulse-ring-${type} {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes pulse-core-${type} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
    </style>
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      background: ${color.bg};
      border-radius: 50%;
      animation: pulse-ring-${type} 1.5s ease-out infinite;
    "></div>
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      background: ${color.pulse};
      border-radius: 50%;
      animation: pulse-ring-${type} 1.5s ease-out infinite 0.4s;
    "></div>
  ` : "";

  // More detailed vehicle icons
  const icons: Record<string, string> = {
    fire: `<path fill="white" d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>`,
    medical: `<path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>`,
    police: `<path fill="white" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`,
    incident: `<path fill="white" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>`,
    user: `<path fill="white" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`,
    nearby: `<circle fill="white" cx="12" cy="12" r="4"/>`,
  };

  const size = type === "incident" ? 48 : type === "user" ? 44 : 40;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
      ">
        ${pulseAnimation}
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color.bg}, ${color.bg}dd);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px ${color.glow}, inset 0 2px 4px rgba(255,255,255,0.3);
          border: 3px solid rgba(255,255,255,0.4);
          ${isResponding || type === "incident" ? `animation: pulse-core-${type} 1s ease-in-out infinite;` : ""}
        ">
          <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24">
            ${icons[type] || icons.incident}
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function DispatchMap({ responders, incidents, nearbyPlaces, userLocation }: DispatchMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routesRef = useRef<Map<string, L.Polyline>>(new Map());
  const animationRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [17.385, 78.4867];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark theme tiles - CARTO Dark Matter
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add attribution
    L.control
      .attribution({ position: "bottomright" })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>')
      .addTo(map);

    mapRef.current = map;

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const markerId = "user-location";
    let marker = markersRef.current.get(markerId);

    if (!marker) {
      marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createMarkerIcon("user"),
        zIndexOffset: 1000,
      })
        .bindPopup(`<div style="text-align:center;font-weight:bold;color:#06b6d4;">📍 Your Location</div>`)
        .addTo(mapRef.current);
      markersRef.current.set(markerId, marker);
    } else {
      marker.setLatLng([userLocation.lat, userLocation.lng]);
    }

    mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation]);

  // Update incident markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old incident markers
    markersRef.current.forEach((marker, id) => {
      if (id.startsWith("incident-") && !incidents.find((i) => id === `incident-${i.id}`)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update incident markers
    incidents.forEach((incident) => {
      const markerId = `incident-${incident.id}`;
      let marker = markersRef.current.get(markerId);

      if (!marker) {
        marker = L.marker([incident.location.lat, incident.location.lng], {
          icon: createMarkerIcon("incident"),
          zIndexOffset: 900,
        })
          .bindPopup(`
            <div style="min-width:150px;">
              <div style="font-weight:bold;color:#ef4444;margin-bottom:4px;">🚨 EMERGENCY</div>
              <div style="color:#fca5a5;text-transform:capitalize;">${incident.type}</div>
              <div style="color:#fef2f2;margin-top:4px;">Priority: ${incident.priority?.toUpperCase()}</div>
            </div>
          `)
          .addTo(mapRef.current!);
        markersRef.current.set(markerId, marker);

        // Pan to incident
        mapRef.current!.flyTo([incident.location.lat, incident.location.lng], 14, {
          duration: 1.5,
        });
      }
    });
  }, [incidents]);

  // Update responder markers with animation
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old routes
    routesRef.current.forEach((route) => route.remove());
    routesRef.current.clear();

    responders.forEach((resp) => {
      const markerId = `responder-${resp.id}`;
      let marker = markersRef.current.get(markerId);

      const popupContent = `
        <div style="min-width:120px;">
          <div style="font-weight:bold;color:${
            resp.type === "fire" ? "#f97316" : resp.type === "medical" ? "#22c55e" : "#3b82f6"
          };">${resp.unit}</div>
          <div style="color:#94a3b8;text-transform:capitalize;">${resp.type}</div>
          <div style="margin-top:4px;color:${
            resp.status === "responding" ? "#fb923c" : resp.status === "available" ? "#4ade80" : "#60a5fa"
          };font-weight:500;">
            ${resp.status.toUpperCase()}
          </div>
          ${resp.eta_minutes ? `<div style="color:#fdba74;margin-top:2px;">ETA: ${resp.eta_minutes} min</div>` : ""}
        </div>
      `;

      if (!marker) {
        marker = L.marker([resp.lat, resp.lng], {
          icon: createMarkerIcon(resp.type, resp.status === "responding"),
          zIndexOffset: 800,
        })
          .bindPopup(popupContent)
          .addTo(mapRef.current!);
        markersRef.current.set(markerId, marker);
      } else {
        marker.setIcon(createMarkerIcon(resp.type, resp.status === "responding"));
        marker.setPopupContent(popupContent);
      }

      // Draw route line if responding
      if (resp.status === "responding" && resp.destination) {
        const routeColor =
          resp.type === "fire" ? "#f97316" : resp.type === "medical" ? "#22c55e" : "#3b82f6";
        const routeColorFaded =
          resp.type === "fire" ? "#f9731640" : resp.type === "medical" ? "#22c55e40" : "#3b82f640";

        // Create glowing background route
        const routeBg = L.polyline(
          [
            [resp.lat, resp.lng],
            [resp.destination.lat, resp.destination.lng],
          ],
          {
            color: routeColorFaded,
            weight: 12,
            opacity: 0.5,
            lineCap: "round",
          }
        ).addTo(mapRef.current!);
        
        // Create animated dashed route on top
        const route = L.polyline(
          [
            [resp.lat, resp.lng],
            [resp.destination.lat, resp.destination.lng],
          ],
          {
            color: routeColor,
            weight: 4,
            opacity: 0.9,
            dashArray: "12, 12",
            lineCap: "round",
            className: "animated-route",
          }
        ).addTo(mapRef.current!);

        routesRef.current.set(`route-bg-${resp.id}`, routeBg);
        routesRef.current.set(`route-${resp.id}`, route);
      }
    });

    // Animate responding units with smoother movement
    const animateResponders = () => {
      responders.forEach((resp) => {
        if (resp.status === "responding" && resp.destination) {
          const marker = markersRef.current.get(`responder-${resp.id}`);
          if (marker) {
            const currentPos = marker.getLatLng();
            const destLat = resp.destination.lat;
            const destLng = resp.destination.lng;

            // Smoother movement with easing
            const speed = 0.00015;
            const newLat = currentPos.lat + (destLat - currentPos.lat) * speed;
            const newLng = currentPos.lng + (destLng - currentPos.lng) * speed;

            marker.setLatLng([newLat, newLng]);

            // Update both route lines
            const route = routesRef.current.get(`route-${resp.id}`);
            const routeBg = routesRef.current.get(`route-bg-${resp.id}`);
            if (route) {
              route.setLatLngs([
                [newLat, newLng],
                [destLat, destLng],
              ]);
            }
            if (routeBg) {
              routeBg.setLatLngs([
                [newLat, newLng],
                [destLat, destLng],
              ]);
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animateResponders);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (responders.some((r) => r.status === "responding")) {
      animateResponders();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [responders]);

  // Update nearby places markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old nearby markers
    markersRef.current.forEach((marker, id) => {
      if (id.startsWith("nearby-")) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add nearby places
    nearbyPlaces.forEach((place, index) => {
      const markerId = `nearby-${index}`;
      const marker = L.marker([place.lat, place.lng], {
        icon: createMarkerIcon("nearby"),
        zIndexOffset: 600,
      })
        .bindPopup(`
          <div style="min-width:150px;">
            <div style="font-weight:bold;color:#8b5cf6;">${place.name}</div>
            <div style="color:#a78bfa;text-transform:capitalize;">${place.type}</div>
            <div style="color:#c4b5fd;margin-top:4px;">${place.distance?.toFixed(1)} km away</div>
          </div>
        `)
        .addTo(mapRef.current!);
      markersRef.current.set(markerId, marker);
    });
  }, [nearbyPlaces]);

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 40, 0.95));
          border: 1px solid rgba(249, 115, 22, 0.4);
          border-radius: 16px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 115, 22, 0.15);
          backdrop-filter: blur(10px);
        }
        .leaflet-popup-content {
          color: white;
          margin: 14px 18px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .leaflet-popup-tip {
          background: rgba(15, 15, 25, 0.98);
          border: 1px solid rgba(249, 115, 22, 0.4);
        }
        .animated-route {
          animation: dash 0.8s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        .leaflet-control-zoom a {
          background: rgba(15, 15, 25, 0.9) !important;
          color: #f97316 !important;
          border-color: rgba(249, 115, 22, 0.3) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(249, 115, 22, 0.2) !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </>
  );
}
