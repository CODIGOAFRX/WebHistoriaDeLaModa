import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { Footer } from "./components/Footer";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const directHost = requestHeaders.get("host")?.trim();
  const candidateHost = forwardedHost || directHost || "localhost:3000";
  let host = "localhost:3000";
  try {
    const candidateUrl = new URL(`http://${candidateHost}`);
    if (
      !candidateUrl.username &&
      !candidateUrl.password &&
      candidateUrl.pathname === "/" &&
      !candidateUrl.search &&
      !candidateUrl.hash
    ) {
      host = candidateUrl.host;
    }
  } catch {
    // Ignore malformed forwarding headers and keep the safe local fallback.
  }
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";
  const origin = `${protocol}://${host}`;
  const description =
    "Historia, cultura y pensamiento para comprender la moda con el historiador del arte Carlos Sánchez de Medina.";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Historia de la Moda — Carlos Sánchez de Medina",
      template: "%s — Historia de la Moda",
    },
    description,
    icons: {
      icon: {
        url: "/images/brand/logo-icon.png?v=20260811",
        type: "image/png",
        sizes: "512x512",
      },
      shortcut: "/images/brand/logo-icon.png?v=20260811",
      apple: "/images/brand/logo-icon.png?v=20260811",
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: "Historia de la Moda — Carlos Sánchez de Medina",
      description,
      url: origin,
      siteName: "Historia de la Moda",
      locale: "es_ES",
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "Historia de la Moda, con Carlos Sánchez de Medina",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Historia de la Moda — Carlos Sánchez de Medina",
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${sans.variable}`}>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
