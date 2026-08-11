import {
  FaInstagram,
  FaLinkedin,
  FaPodcast,
  FaSpotify,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";

type SocialIconName =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "spotify"
  | "ivoox";

type SocialLink = {
  label: string;
  href: string | null;
  icon: SocialIconName;
};

// Carlos confirma TikTok como canal oficial; utiliza el mismo handle de marca.
export const TIKTOK_URL = "https://www.tiktok.com/@historia_de_la_moda";

const socialLinks: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/historia_de_la_moda/",
    icon: "instagram",
  },
  { label: "TikTok", href: TIKTOK_URL, icon: "tiktok" },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Historia_de_la_moda",
    icon: "youtube",
  },
  {
    label: "LinkedIn",
    href: "https://es.linkedin.com/in/carlos-s%C3%A1nchez-de-medina-alcina",
    icon: "linkedin",
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/show/5azV7BnvrJGkHWTDEful8k",
    icon: "spotify",
  },
  {
    label: "iVoox",
    href: "https://www.ivoox.com/podcast-historia-moda-podcast_sq_f12837071_1.html",
    icon: "ivoox",
  },
];

function SocialIcon({ name }: { name: SocialIconName }) {
  const icons = {
    instagram: FaInstagram,
    tiktok: FaTiktok,
    youtube: FaYoutube,
    linkedin: FaLinkedin,
    spotify: FaSpotify,
    ivoox: FaPodcast,
  };
  const Icon = icons[name];

  return <Icon aria-hidden="true" focusable="false" />;
}

export function SocialLinks() {
  return (
    <ul className="social-links-list" aria-label="Perfiles oficiales de Carlos Sánchez de Medina">
      {socialLinks.map((social) => (
        <li key={social.label}>
          {social.href ? (
            <a
              className="social-link-card"
              href={social.href}
              target="_blank"
              rel="noreferrer"
              title={social.label}
              aria-label={`Abrir ${social.label} en una pestaña nueva`}
            >
              <SocialIcon name={social.icon} />
            </a>
          ) : (
            <span
              className="social-link-card is-pending"
              role="note"
              title={`${social.label}: enlace oficial pendiente de confirmar`}
              aria-label={`${social.label}: enlace oficial pendiente de confirmar`}
            >
              <SocialIcon name={social.icon} />
              <small>Enlace pendiente</small>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
