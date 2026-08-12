"use client";

import { useState } from "react";
import type { PodcastEpisode } from "../data/content";

export function PodcastArchive({ episodes }: { episodes: PodcastEpisode[] }) {
  const [active, setActive] = useState(episodes[0]);

  return (
    <div className="podcast-archive">
      <section className="podcast-player" aria-live="polite">
        <div className="podcast-player-art">
          <img src={active.cover} alt={`Portada de ${active.title}`} />
          <span>{active.number}</span>
        </div>
        <div className="podcast-player-copy">
          <p className="eyebrow">Ahora escuchas · Episodio {active.number}</p>
          <h2 tabIndex={-1}>{active.title}</h2>
          <p>{active.subtitle}</p>
          <iframe
            key={active.ivooxId}
            title={`Reproductor de ${active.title}`}
            src={`https://www.ivoox.com/player_ej_${active.ivooxId}_6_1.html`}
            loading="lazy"
            allow="autoplay"
          />
        </div>
      </section>

      <div className="episode-grid" aria-label="Todos los episodios">
        {episodes.map((episode) => {
          const selected = active.ivooxId === episode.ivooxId;
          return (
            <button
              className={`episode-card${selected ? " is-active" : ""}`}
              type="button"
              key={episode.ivooxId}
              onClick={(event) => {
                setActive(episode);
                window.requestAnimationFrame(() => {
                  const player = document.querySelector<HTMLElement>(".podcast-player");
                  player?.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "auto"
                      : "smooth",
                    block: "center",
                  });
                  if (event.detail === 0) {
                    player
                      ?.querySelector<HTMLElement>(".podcast-player-copy h2")
                      ?.focus({ preventScroll: true });
                  }
                });
              }}
              aria-pressed={selected}
            >
              <span className="episode-cover">
                <img src={episode.cover} alt="" loading="lazy" />
                <i aria-hidden="true">{selected ? "Seleccionado" : "Escuchar"}</i>
              </span>
              <span className="episode-meta">
                <b>{episode.number}</b>
                <span>{episode.title}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
