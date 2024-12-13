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

# Understanding the Importance of SQL Query for Distinct IP Analysis by Country

## The Query
```sql
SELECT country, 
       COUNT(DISTINCT ip) AS distinct_ip_count
FROM ip_info
GROUP BY country
ORDER BY country;
```

## What Does This Query Do?
This SQL query provides valuable insights by:

1. **Counting Unique Visitors**: It calculates the distinct number of IP addresses for each country, effectively showing the number of unique users accessing your site or service from each location.
2. **Grouping by Country**: Organizes the data by country, allowing for an easy understanding of user distribution geographically.
3. **Sorting the Results**: Orders the output alphabetically by country, making it user-friendly and straightforward to interpret.

## Why Is This Important?

### 1. **Understand Geographic Reach**
By identifying where your users are coming from, you can assess the global impact of your website or application. This data is essential for tailoring your services to different regions and understanding user demographics.

### 2. **Optimize Performance**
If a significant number of users are accessing your service from a specific country, you might want to:
- Optimize server locations for reduced latency.
- Translate content into local languages.
- Ensure compliance with regional laws and regulations.

### 3. **Target Marketing Campaigns**
Knowing which countries generate the most traffic helps in designing targeted marketing campaigns that resonate with the specific needs and preferences of users in those areas.

### 4. **Detect Anomalies and Security Threats**
Monitoring distinct IP counts per country can help:
- Spot unusual spikes in traffic from a single location, which could indicate potential security threats.
- Identify regions with low traffic, signaling possible connectivity issues or user disengagement.

## Practical Applications
- **Website Analytics**: Gain insights into user distribution.
- **Business Intelligence**: Use data to support strategic decisions and expansion plans.
- **Security and Compliance**: Track access patterns to ensure secure and legal operations across regions.

## Output Example
Imagine the following sample output:

| Country | Distinct IP Count |
|---------|--------------------|
| Brazil  | 125               |
| USA     | 300               |
| India   | 200               |

From this data, you can see that the USA has the highest number of unique users, indicating a potentially strong market there.

## Conclusion
This query is a powerful tool for extracting actionable insights from your IP tracking database. By understanding distinct user counts by country, you can make informed decisions to improve user experience, strengthen security, and expand your business efficiently.

# IP Locations Map Page

This page displays a map showing the locations of various IP addresses fetched from the Supabase database. The map uses OpenStreetMap as a tile layer and custom markers to visualize locations based on their latitude and longitude.

## Key Features:

- **Dynamic Map**: The map is responsive and adjusts its size based on the screen width and height.
- **Interactive Markers**: Custom markers are placed on the map based on the location data retrieved from the database. Each marker displays the city, country, and hostname of the IP address when clicked.
- **Responsive Design**: The map adjusts its height based on the viewport size to ensure a good user experience on both desktop and mobile devices.

## How it Works:

1. **Fetching Data**: The page fetches location data (`loc`, `city`, `country`, `hostname`) from a Supabase database.
2. **Rendering the Map**: Using the `leaflet` library, a map is rendered and customized with OpenStreetMap tiles. The map is initialized with a zoom level of 2 and centered at `[0, 0]`.
3. **Custom Markers**: For each location, a custom SVG marker is placed on the map. The marker's color is red, and it displays a circle with a black outline. A popup with the location details (city, country, hostname) is bound to each marker.

## Responsive Layout:

The map container is set to adjust its height dynamically based on the viewport's size, making it responsive on mobile and desktop. The map height is defined as 50% of the viewport height (`50vh`), which changes to 40% on tablet-sized screens and 30% on small mobile screens, thanks to media queries.

## Visual Preview

![IP Locations Map](/mapiplocation.png)


