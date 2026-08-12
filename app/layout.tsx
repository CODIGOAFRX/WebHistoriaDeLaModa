import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

export const SITE_ORIGIN = "https://historiadelamoda.net";

const description =
  "Historia, cultura y pensamiento para comprender la moda con el historiador del arte Carlos Sánchez de Medina.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Historia de la Moda — Carlos Sánchez de Medina",
    template: "%s — Historia de la Moda",
  },
  description,
  alternates: { canonical: "./" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Historia de la Moda — Carlos Sánchez de Medina",
    description,
    url: SITE_ORIGIN,
    siteName: "Historia de la Moda",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og.png",
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
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
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
