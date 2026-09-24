import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({ variable: "--font-raleway", subsets: ["latin"], style: ["normal", "italic"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Advisor Stock Copilot",
  description: "Live quotes and SEC filing summaries for financial advisors",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${outfit.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
