import { createRoot } from "react-dom/client";
import { LibraryGrid } from "../../app/biblioteca/LibraryGrid";
import "../../app/globals.css";

const cover = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#a06060"/><text x="40" y="100" fill="white" font-size="30">Historia de la moda</text></svg>')}`;
const books = [
  { id: 1, title: "Historia del vestido", author: "Autora de prueba", categories: ["Historia"], coverUrl: cover, description: "Una reseña breve para comprobar que la ficha conserva su altura natural." },
  { id: 2, title: "Textiles y cultura", author: "Autor de prueba", categories: ["Textiles"], coverUrl: "", description: Array.from({ length: 30 }, (_, index) => `Párrafo ${index + 1}. Los tejidos, sus técnicas y los cambios en la indumentaria forman parte de la historia cultural. Esta reseña debe poder leerse completa desplazando la ficha.`).join("\n") },
];

createRoot(document.getElementById("root")!).render(
  <section className="library-section section-pad-sm"><div className="shell"><h1>Biblioteca</h1><LibraryGrid books={books} /></div></section>,
);
