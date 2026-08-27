"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LibraryBook } from "./LibraryGrid";

/** Debe cubrir la transición de salida declarada en `.book-dialog`. */
const CLOSE_ANIMATION_MS = 460;

function toParagraphs(description: string) {
  return description
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function BookDialog({ book, onClose }: { book: LibraryBook | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !book) return;

    if (!dialog.open) dialog.showModal();
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    document.body.classList.add("book-dialog-open");

    const closeFromBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    // El cierre nativo solo retira `open`: la ficha sigue montada mientras se
    // desvanece y se desmonta después, salvo que ya se haya abierto otro libro.
    let released = false;
    const unmountAfterExit = () => {
      if (released || dialog.open) return;
      released = true;
      document.body.classList.remove("book-dialog-open");
      window.setTimeout(() => {
        if (!dialogRef.current?.open) onClose();
      }, CLOSE_ANIMATION_MS);
    };
    // Se escuchan los dos eventos a propósito: `close` es el histórico y
    // `toggle` el moderno, y hay motores que solo emiten uno de ellos.
    const unmountOnToggle = (event: Event) => {
      if ((event as Event & { newState?: string }).newState === "closed") unmountAfterExit();
    };

    // Refuerzo del cierre nativo con Escape, que no todos los motores aplican.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !dialog.open) return;
      event.preventDefault();
      dialog.close();
    };

    document.addEventListener("keydown", closeOnEscape);
    dialog.addEventListener("click", closeFromBackdrop);
    dialog.addEventListener("close", unmountAfterExit);
    dialog.addEventListener("toggle", unmountOnToggle);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      dialog.removeEventListener("click", closeFromBackdrop);
      dialog.removeEventListener("close", unmountAfterExit);
      dialog.removeEventListener("toggle", unmountOnToggle);
      document.body.classList.remove("book-dialog-open");
    };
  }, [book, onClose]);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else onClose();
  }, [onClose]);

  if (!book) return null;

  const paragraphs = toParagraphs(book.description);

  return (
    <dialog ref={dialogRef} className="book-dialog" aria-labelledby="book-dialog-title">
      <div className="book-dialog-panel">
        <div className="book-dialog-bar">
          <p className="eyebrow">Ficha del libro</p>
          <button type="button" className="book-dialog-close" onClick={requestClose}>
            <span>Cerrar</span>
            <span className="book-dialog-close-mark" aria-hidden="true">
              ×
            </span>
          </button>
        </div>

        <div
          className="book-dialog-scroll"
          ref={scrollRef}
          role="region"
          aria-label={`Reseña de ${book.title}`}
          tabIndex={0}
        >
          <div className="book-dialog-grid">
            <div className="book-dialog-cover">
              <div className="book-dialog-cover-frame">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={`Portada de ${book.title}`} />
                ) : (
                  <span aria-hidden="true">HM</span>
                )}
              </div>
            </div>

            <div className="book-dialog-copy">
              {book.category ? <p className="book-dialog-category">{book.category}</p> : null}
              <h2 id="book-dialog-title">{book.title}</h2>
              {book.author ? <p className="book-dialog-author">{book.author}</p> : null}
              <div className="book-dialog-text">
                {paragraphs.length ? (
                  paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>La reseña de este título llegará muy pronto.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
