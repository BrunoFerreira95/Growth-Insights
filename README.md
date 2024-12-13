# Growth-Insights
# IP Tracking Middleware for Next.js

This middleware provides an easy and cost-free solution for tracking IP addresses and their geolocation on your website. It leverages free APIs and open-source tools, meaning you don’t need to pay for services like Google Cloud or configure tracking on Vercel. The idea is to capture user IPs and track their origin seamlessly.

## **How It Works**

### **1. Route Restriction**
- Only allows requests to specific routes (`/`, `/poem`, `/monitoring`).
- Returns a `403 Forbidden` response for unauthorized routes.

### **2. IP Address Capture**
- Extracts the user's IP from the `x-forwarded-for` header in the request.
- Returns a `400 Bad Request` error if the IP address is unavailable.

### **3. Geolocation Retrieval**
- Uses the [IPinfo API](https://ipinfo.io) to fetch geolocation details based on the user’s IP.
- Retrieves the following:
  - **IP**
  - **City**
  - **Region**
  - **Country**
  - **Coordinates**
  - **Timezone**
  - **Postal Code**

### **4. Data Storage**
- Saves the IP information into a Supabase database table (`ip_info`) using the `upsert` method.
- Ensures no duplicate entries by leveraging UUIDs for unique identification.

### **5. No Paid Services Needed**
- This middleware relies on the free IPinfo API for basic geolocation services (requires a free token).
- Uses Supabase, an open-source backend, for storing and managing data without additional costs.

## **Why Use This Middleware?**

- **No Vendor Lock-In**: You don’t need to rely on proprietary tools like Google Analytics or Vercel-specific configurations.
- **Privacy-Friendly**: Data is stored in your database, giving you full control over user information.
- **Cost-Effective**: The setup uses free tiers of services, avoiding extra charges.

## **Code Implementation**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./lib/supabaseClient";

const IPINFO_API_URL = "https://ipinfo.io";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow only specific routes
  if (!["/", "/poem", "/monitoring"].includes(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Access to this endpoint is not allowed" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for");

  if (!ip) {
    return NextResponse.json({ error: "IP not found" }, { status: 400 });
  }

  const ipInfo = await getIpInfoFromIp(ip);

  await saveIpInfoToDatabase(ipInfo);

  return response;
}

const getIpInfoFromIp = async (ip: string) => {
  try {
    const res = await fetch(`${IPINFO_API_URL}/${ip}/json?token=${process.env.IP_KEY}`);
    const data = await res.json();
    return {
      ip: data.ip,
      hostname: data.hostname,
      city: data.city,
      region: data.region,
      country: data.country,
      loc: data.loc,
      org: data.org,
      postal: data.postal,
      timezone: data.timezone,
    };
  } catch (error) {
    console.error("Error fetching IP info:", error);
    return null;
  }
};

const saveIpInfoToDatabase = async (ipInfo: any) => {
  if (!ipInfo) return;

  const supabase = createClient();

  const { error } = await supabase.from("ip_info").upsert([
    {
      id: crypto.randomUUID(),
      ip: ipInfo.ip,
      hostname: ipInfo.hostname,
      city: ipInfo.city,
      region: ipInfo.region,
      country: ipInfo.country,
      loc: ipInfo.loc,
      org: ipInfo.org,
      postal: ipInfo.postal,
      timezone: ipInfo.timezone,
    },
  ]);

  if (error) {
    console.error("Error saving IP info to Supabase:", error);
  }
};
```

## **Conclusion**
This middleware is an efficient, cost-free way to track IPs and their origins on your website. With tools like IPinfo and Supabase, you maintain full control over user data without relying on paid services or heavy configurations. Perfect for privacy-conscious and budget-focused projects!
