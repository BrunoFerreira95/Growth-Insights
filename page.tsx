'use client'
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabaseClient";

// Dynamically import the Leaflet map component to disable SSR
const Map = dynamic(() => import("leaflet"), { ssr: false });

export default function MapPage() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    async function fetchLocations() {
      const supabase = createClient();
      const { data, error } = await supabase.from("ip_info").select("loc, city, country, hostname");

      if (error) {
        console.error("Error fetching locations from Supabase:", error);
      } else {
        setLocations(data.filter((item) => item.loc)); // Ensure loc field is available
      }
    }

    fetchLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0 && typeof window !== "undefined") {
      const L = require("leaflet");

      const map = L.map("map").setView([0, 0], 2); // Set initial map view

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      locations.forEach(({ loc, city, country, hostname }) => {
        const [lat, lng] = loc.split(",").map(Number);

        // Create a custom SVG marker
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2" fill="red" />
            </svg>
          `,
          iconSize: [30, 30],
        });

        // Add marker to the map with custom SVG icon
        L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<h3>${city}, ${country}</h3><p>${hostname}</p>`);
      });

      return () => map.remove(); // Clean up map instance on unmount
    }
  }, [locations]);

  return (
    <div>
      <h1>IP Locations Map</h1>
      <div id="map" className="w-full" style={{ height: "50vh", width: "50v" }}></div>
    </div>
  );
}
