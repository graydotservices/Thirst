import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const lilita = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const nunito = Nunito({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Thirst. — One For Living | Premium Desserts & Cafe",
    template: "%s | Thirst.",
  },
  description:
    "Thirst. is a premium luxury dessert and cafe brand offering handcrafted cakes, artisan ice creams, and special desserts. Experience the taste of excellence.",
  keywords: [
    "thirst cafe",
    "premium desserts",
    "luxury cakes",
    "artisan ice cream",
    "dessert brand",
    "franchise",
    "cafe",
  ],
  openGraph: {
    title: "Thirst. — One For Living",
    description:
      "Premium luxury desserts and cafe experiences. Handcrafted with love.",
    url: "https://thirstcafe.in",
    siteName: "Thirst.",
    images: [
      {
        url: "https://thirstcafe.in/dream-cake.png",
        width: 1200,
        height: 630,
        alt: "Thirst Dream Cake",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thirst. — One For Living",
    description: "Premium luxury desserts and cafe experiences.",
    images: ["https://thirstcafe.in/dream-cake.png"],
  },
  metadataBase: new URL("https://thirstcafe.in"),
};

import Preloader from "@/components/Preloader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lilita.variable} ${nunito.variable}`}
      style={
        {
          "--font-heading": "var(--font-heading)",
          "--font-body": "var(--font-body)",
        } as React.CSSProperties
      }
    >
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CafeOrCoffeeShop",
              "name": "Thirst.",
              "image": "https://thirstcafe.in/dream-cake.png",
              "url": "https://thirstcafe.in",
              "telephone": "+919999999999",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Thiruvallur High Road",
                "addressLocality": "Thiruvallur",
                "addressRegion": "Tamil Nadu",
                "postalCode": "602001",
                "addressCountry": "IN"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "10:00",
                "closes": "23:00"
              },
              "priceRange": "₹₹",
              "servesCuisine": "Desserts, Coffee, Waffles, Thick Shakes"
            })
          }}
        />
        <Preloader />
        {children}
      </body>
    </html>
  );
}
