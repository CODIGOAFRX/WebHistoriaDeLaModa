"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/#historia", label: "Historia" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/conferencias", label: "Conferencias" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/escuela", label: "Aula" },
  { href: "/archivo", label: "Archivo" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <header className="site-header">
      <Link
        className="brand"
        href="/"
        aria-label="Historia de la Moda, inicio"
        onClick={() => setOpen(false)}
      >
        <img src="/images/brand/logo-wordmark.png" alt="Historia de la Moda" />
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{open ? "Cerrar" : "Menú"}</span>
        <span className="menu-toggle-mark" aria-hidden="true">
          {open ? "×" : "+"}
        </span>
      </button>

      <nav
        id="site-navigation"
        className={`site-nav${open ? " is-open" : ""}`}
        aria-label="Navegación principal"
      >
        <div className="site-nav-links">
          {navigation.map((item, index) => {
            const route = item.href.split("#")[0] || "/";
            const active = route === "/" ? pathname === "/" : pathname.startsWith(route);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="nav-index">0{index + 1}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <a
          className="nav-instagram"
          href="https://www.instagram.com/historia_de_la_moda/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
