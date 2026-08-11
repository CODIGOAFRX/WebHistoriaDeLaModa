export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-mark" aria-hidden="true">
        <img src="/images/brand/logo-icon-white.png" alt="" />
      </div>
      <div className="footer-main">
        <p className="eyebrow">Historia de la Moda</p>
        <p className="footer-statement">
          Mirar el pasado para comprender<br />
          todo lo que vestimos hoy.
        </p>
      </div>
      <div className="footer-links">
        <a href="mailto:demedinamoda@gmail.com">Contacto</a>
        <a
          href="https://www.instagram.com/historia_de_la_moda/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        <a
          href="https://www.youtube.com/@Historia_de_la_moda"
          target="_blank"
          rel="noreferrer"
        >
          YouTube
        </a>
        <a href="/admin">Administración</a>
      </div>
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} Historia de la Moda</span>
      </div>
    </footer>
  );
}
