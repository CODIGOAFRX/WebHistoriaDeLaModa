"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { href: "/#historia", label: "Historia" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/conferencias", label: "Conferencias" },
  { href: "/escuela", label: "Aula" },
  { href: "/archivo", label: "Archivo" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const mobileNavigation = window.matchMedia("(max-width: 980px)");
    const closeWhenDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setOpen(false);
    };
    mobileNavigation.addEventListener("change", closeWhenDesktop);
    return () => mobileNavigation.removeEventListener("change", closeWhenDesktop);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("menu-open");
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        toggleRef.current?.focus();
      }
      return;
    }

    wasOpenRef.current = true;
    document.body.classList.add("menu-open");

    const isolatedElements = [
      document.querySelector<HTMLElement>("main"),
      document.querySelector<HTMLElement>("footer"),
    ].filter((element): element is HTMLElement => element !== null);
    const previousIsolation = isolatedElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));

    for (const element of isolatedElements) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      [...(headerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])].filter(
        (element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true",
      );

    const focusFirstNavigationLink = () =>
      navigationRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    focusFirstNavigationLink();
    const focusTimer = window.setTimeout(focusFirstNavigationLink, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        toggleRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !headerRef.current?.contains(activeElement))) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !headerRef.current?.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("menu-open");
      for (const { element, ariaHidden, inert } of previousIsolation) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
    };
  }, [open]);

  return (
    <header ref={headerRef} className="site-header site-header--dark">
      <a
        className="brand"
        href="/"
        aria-label="Historia de la Moda, inicio"
        onClick={() => setOpen(false)}
      >
        <img src="/images/brand/logo-wordmark-white.png" alt="Historia de la Moda" />
      </a>

      <button
        ref={toggleRef}
        className="menu-toggle"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
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
        ref={navigationRef}
        id="site-navigation"
        className={`site-nav${open ? " is-open" : ""}`}
        aria-label="Navegación principal"
      >
        <div className="site-nav-links">
          {navigation.map((item, index) => {
            const route = item.href.split("#")[0] || "/";
            const active = route === "/" ? pathname === "/" : pathname.startsWith(route);
            return (
              <a
                key={item.href}
                href={item.href}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="nav-index">0{index + 1}</span>
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
