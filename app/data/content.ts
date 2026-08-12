export type PodcastEpisode = {
  number: string;
  title: string;
  subtitle: string;
  cover: string;
  ivooxId: string;
};

export const podcastEpisodes: PodcastEpisode[] = [
  {
    number: "01",
    title: "Si Balenciaga levantase la cabeza",
    subtitle: "Genio, legado y los límites de una marca después de su creador.",
    cover: "/images/podcasts/01-balenciaga.webp",
    ivooxId: "161558549",
  },
  {
    number: "02",
    title: "La primera influencer de la historia",
    subtitle: "Imagen, poder y la fabricación temprana de una figura pública.",
    cover: "/images/podcasts/02-primera-influencer.webp",
    ivooxId: "161965401",
  },
  {
    number: "03",
    title: "De la guillotina al algoritmo",
    subtitle: "Cómo cambian los mecanismos que deciden qué está de moda.",
    cover: "/images/podcasts/03-guillotina-algoritmo.webp",
    ivooxId: "162620070",
  },
  {
    number: "04",
    title: "Pioneras e insumisas",
    subtitle: "Mujeres que utilizaron la indumentaria para abrir caminos.",
    cover: "/images/podcasts/04-pioneras-insumisas.webp",
    ivooxId: "163017040",
  },
  {
    number: "05",
    title: "Los Fortuny",
    subtitle: "Una familia entre pintura, tejido, innovación y memoria.",
    cover: "/images/podcasts/05-fortuny.webp",
    ivooxId: "163393057",
  },
  {
    number: "06",
    title: "Modas que matan",
    subtitle: "Belleza, riesgo y las prendas que llevaron el cuerpo al límite.",
    cover: "/images/podcasts/06-modas-que-matan.webp",
    ivooxId: "164169399",
  },
  {
    number: "07",
    title: "Escultores de la moda",
    subtitle: "Cuando el vestido se construye como volumen y arquitectura.",
    cover: "/images/podcasts/07-escultores-moda.webp",
    ivooxId: "166157673",
  },
  {
    number: "08",
    title: "Del maniquí a la modelo",
    subtitle: "La aparición de una profesión que cambió la manera de mostrar moda.",
    cover: "/images/podcasts/08-del-maniqui-a-la-modelo.webp",
    ivooxId: "167193782",
  },
  {
    number: "09",
    title: "Christian Dior",
    subtitle: "La figura, la casa y el gesto que redibujó la posguerra.",
    cover: "/images/podcasts/09-christian-dior.webp",
    ivooxId: "167899370",
  },
  {
    number: "10",
    title: "Los colores en la moda I",
    subtitle: "Significados, pigmentos y códigos que nunca han sido neutrales.",
    cover: "/images/podcasts/10-colores-moda.webp",
    ivooxId: "168677167",
  },
  {
    number: "11",
    title: "De la modelo a la influencer",
    subtitle: "Del ideal sobre la pasarela a la identidad en la pantalla.",
    cover: "/images/podcasts/11-modelo-influencer.webp",
    ivooxId: "169614961",
  },
  {
    number: "12",
    title: "Los colores del lujo",
    subtitle: "Púrpura, oro, negro: una historia del precio convertido en imagen.",
    cover: "/images/podcasts/12-colores-lujo.webp",
    ivooxId: "171650491",
  },
  {
    number: "13",
    title: "Pelucas: el poder",
    subtitle: "Cabello, artificio y autoridad a lo largo de los siglos.",
    cover: "/images/podcasts/13-pelucas.webp",
    ivooxId: "172891175",
  },
];

export type Conference = {
  title: string;
  context: string;
  duration: string;
  year: string;
  videoId?: string;
  href?: string;
  featured?: boolean;
};

export const conferences: Conference[] = [
  {
    title: "La historia de la moda en 10 vestidos",
    context: "5 MAM Fashion Forum · Museo del Automóvil y la Moda de Málaga",
    duration: "16 de abril",
    year: "2026",
    href: "https://museoautomovilmoda.com/mes-de-la-moda-5mff/",
  },
  {
    title: "La historia de la moda en 10 vestidos",
    context: "Museo del Automóvil y la Moda de Málaga",
    duration: "Masterclass",
    year: "2024",
    videoId: "KhFMU8wAqEI",
    featured: true,
  },
  {
    title: "De Bronzino a Madrazo",
    context: "La indumentaria a través de la pintura · Universidad de Almería",
    duration: "45 min",
    year: "2021",
    videoId: "AN1LkIq0SAA",
  },
  {
    title: "Del museo al escaparate",
    context: "Arte y moda",
    duration: "75 min",
    year: "2020",
    videoId: "yYdjksM6WwI",
  },
  {
    title: "Mariano Fortuny",
    context: "Universo Fortuny · Museo Casa de los Tiros",
    duration: "72 min",
    year: "2018",
    videoId: "fNpCVX9qdHU",
  },
  {
    title: "Marilyn Monroe, icono del diseño",
    context: "Festival Internacional de Cine Clásico RetroBack",
    duration: "30 min",
    year: "2011",
    videoId: "54r-yw9Ghcs",
  },
];

export type MediaAppearance = {
  outlet: string;
  title: string;
  year: string;
  kind: string;
  href: string;
  featured?: boolean;
};

export const mediaAppearances: MediaAppearance[] = [
  {
    outlet: "RTVE · La 2",
    title: "Geópolis: la geopolítica de la cosmética",
    year: "2024",
    kind: "Televisión",
    href: "https://www.rtve.es/rtve/20240411/geopolitica-cosmetica-a-debate-estreno-geopolis-con-silvia-intxaurrondo/16055570.shtml",
    featured: true,
  },
  {
    outlet: "Canal Sur",
    title: "La Memoria: indumentaria, moda, evolución y género",
    year: "2023",
    kind: "Televisión",
    href: "https://www.canalsur.es/rtva/comunicacion/memoria-reflexiona-indumentaria-moda-evolucion_1_1228124.html",
    featured: true,
  },
  {
    outlet: "La Vanguardia",
    title: "Agonía y ocaso del zapato",
    year: "2026",
    kind: "Prensa",
    href: "https://www.lavanguardia.com/vida/20260322/11495827/agonia-ocaso-zapato.html",
    featured: true,
  },
  {
    outlet: "El Confidencial",
    title: "Tacones, corsés y cómo vestiremos",
    year: "2023",
    kind: "Prensa · Podcast",
    href: "https://www.elconfidencial.com/espana/2023-09-28/pausa-podcast-tacones-corses-vestiremos_3743282/",
    featured: true,
  },
  {
    outlet: "¡HOLA! Fashion",
    title: "La estética flapper y los años veinte",
    year: "2022",
    kind: "Prensa",
    href: "https://www.hola.com/fashion/tendencias/2022011272771/estetica-flapper-vestidos-flecos/",
  },
  {
    outlet: "Canal Sur",
    title: "Historia de Barbie, musa de los mejores diseñadores",
    year: "2023",
    kind: "Televisión",
    href: "https://www.canalsur.es/television/andalucia-es-moda/historia-barbie-musa-mejores-disenadores_1_1303458.html",
  },
  {
    outlet: "Museo del Automóvil y la Moda",
    title: "Perfil oficial como ponente del Mes de la Moda",
    year: "2026",
    kind: "Institución",
    href: "https://museoautomovilmoda.com/ponentes-5mff/",
  },
  {
    outlet: "Cadena SER",
    title: "El Mes de la Moda conecta talento, industria y cultura",
    year: "2026",
    kind: "Radio · Prensa",
    href: "https://cadenaser.com/andalucia/2026/04/07/el-mam-da-el-pistoletazo-de-salida-al-mes-de-la-moda-con-un-cartel-que-conecta-talento-industria-y-cultura-ser-malaga/",
  },
];

export const collaborations: MediaAppearance[] = [
  {
    outlet: "Pausa · El Confidencial",
    title: "La moda se ha vuelto loca",
    year: "2026",
    kind: "Podcast",
    href: "https://www.ivoox.com/moda-se-ha-vuelto-loca-pausa-audios-mp3_rf_175804239_1.html",
    featured: true,
  },
  {
    outlet: "Fashion Fashionae",
    title: "Conversación con Carlos Sánchez de Medina",
    year: "2025",
    kind: "Videopodcast",
    href: "https://www.youtube.com/watch?v=LjLEn5uwfcM",
    featured: true,
  },
  {
    outlet: "All That She Wants",
    title: "Moda e ideología",
    year: "2024",
    kind: "Podcast",
    href: "https://podcasts.apple.com/mx/podcast/moda-e-ideolog%C3%ADa-con-carlos-s%C3%A1nchez-de-medina-alcina/id1687640922?i=1000660187608",
  },
  {
    outlet: "Museo Cerralbo · Radio 19",
    title: "Cerralbo entre sedas y abanicos",
    year: "2024",
    kind: "Podcast institucional",
    href: "https://www.cultura.gob.es/mcerralbo/investigacion/publicaciones/radio-19.html",
  },
  {
    outlet: "A Toda Moda",
    title: "Carlos Sánchez de Medina, historiador de la moda",
    year: "2023",
    kind: "Podcast",
    href: "https://podcasts.apple.com/gb/podcast/11-carlos-s%C3%A1nchez-de-medina-historiador-de-la-moda/id1700717254?i=1000637350577",
  },
  {
    outlet: "Moda se escribe con Ñ",
    title: "Moda e historia",
    year: "2023",
    kind: "Podcast",
    href: "https://www.ivoox.com/moda-e-historia-carlos-sanchez-medina-audios-mp3_rf_103739510_1.html",
  },
  {
    outlet: "Relatos de la Historia",
    title: "Especial Historia de la Moda",
    year: "2025",
    kind: "Podcast",
    href: "https://www.ivoox.com/especial-historia-moda-carlos-sanchez-audios-mp3_rf_160875445_1.html",
  },
];
