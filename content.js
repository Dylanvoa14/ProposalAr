/* ============================================================
   LA MESA — Temporada 1
   TODO EL CONTENIDO EDITABLE ESTÁ EN ESTE ARCHIVO.
   Dylan: cambia textos aquí sin tocar app.js ni index.html.
   ============================================================ */

const CONFIG = {
  // Clave del modo desarrollador: abre la web con  ?dev=lamesa67  para
  // desbloquear todo y probar. Con ?dev=off se desactiva.
  devKey: "lamesa67",

  // ---- FINAL DE TEMPORADA (puedes cambiarlo hasta el día 6) ----
  // "presencial": el final la dirige a un lugar donde tú la esperas.
  // "mensaje":    el final la invita a hablar contigo, sin lugar fijo.
  finaleMode: "mensaje",

  finalePresencialTexto:
    "Lo demás no te lo va a decir una página web. Te lo quiero decir yo. " +
    "Búscame hoy — ya sabes dónde encontrarme.",
  // ↑ Si eliges "presencial", edita esto con lugar y hora concretos.

  finaleMensajeTexto:
    "Lo demás no te lo va a decir una página web. Te lo quiero decir yo, " +
    "cuando tú quieras y sin ningún apuro. Escríbeme.\n\nMorning, pequeña Ari.",
};

/* Cada episodio se desbloquea a las 00:00 hora de Lima (UTC-5).
   Las fechas están en UTC: 00:00 Lima = 05:00 UTC. */

const EPISODES = [
  {
    num: 1,
    title: "Piloto",
    genre: "El origen",
    unlockISO: "2026-07-16T05:00:00Z",
    accent: "#7fb4c9",
    synopsis: "Cuatro tipos, una mesa de ping pong y una interrupción no solicitada.",
    lockedHint: "Disponible el 16 de julio",
    // Interacción: tocar la pelota de ping pong hace avanzar la historia
    vignettes: [
      "Había una vez cuatro tipos y una mesa de ping pong: Gianfranco, César, Ignacio y yo.",
      "Éramos un grupo cerrado. Nadie entraba. Nadie salía. Solo ping pong.",
      "Hasta que un día, un grupo de chicas se acercó a jugar. Spoiler: no fue por el ping pong.",
      "Fue porque a una de ellas le gustaba Ignacio. En serio. Así de random empezó todo.",
      "Y en ese grupo venía una niña que, sin que nadie lo planeara, se iba a volver mi mejor amiga.",
    ],
    quote: "A veces la vida te cambia de mesa sin avisar.",
    hiddenWord: "vida",
    teaser: "Próximo episodio: alguien jura que come un montón. La evidencia dirá lo contrario.",
  },
  {
    num: 2,
    title: "En el que nos dolió la barriga",
    genre: "Sitcom",
    unlockISO: "2026-07-17T05:00:00Z",
    accent: "#e5c46b",
    synopsis: "Grabado frente a un público en vivo (nosotros mismos).",
    lockedHint: "Disponible el 17 de julio",
    // Interacción: botón de risas — cada tanda de risas avanza la escena
    scenes: [
      "UBICACIÓN: Friday's. ELENCO: nosotros. PRESUPUESTO: cuestionable.",
      "Ella dijo que tenía hambre. Que iba a comer UN MONTÓN. Palabras textuales.",
      "El plato llegó. El plato casi se fue igual que llegó. El jurado tiene su veredicto.",
      "No me acuerdo ni de la mitad de las cosas de las que nos reímos esa noche.",
      "Solo sé que al día siguiente me seguía doliendo la barriga. De reírme. Eso no pasa con cualquiera.",
    ],
    laughButtonLabel: "risas",
    quote: "Hay risas que te dejan doliendo la barriga hasta el día siguiente. Las mejores fueron contigo.",
    hiddenWord: "contigo",
    teaser: "Próximo episodio: alguien pasa mucho miedo en una sala de cine. No diremos quién.",
  },
  {
    num: 3,
    title: "Los pasillos",
    genre: "Terror",
    unlockISO: "2026-07-18T05:00:00Z",
    accent: "#c9d64f",
    synopsis: "Este episodio se ve mejor con las luces apagadas.",
    lockedHint: "Disponible el 18 de julio",
    // Interacción: pasillo oscuro, se ilumina con el dedo, hay que encontrar los textos y la salida
    wallTexts: [
      "Fuimos al cine a ver Backrooms.",
      "Alguien dijo que las películas de terror no le daban miedo.",
      "Ese alguien se asustó. Bastante.",
      "Y yo, como buen mejor amigo, la fastidié por eso durante semanas. Sin arrepentimientos.",
    ],
    exitLabel: "SALIDA",
    quote: "Al final no importaba encontrar la salida. Importaba seguir caminando acompañado.",
    hiddenWord: "seguir",
    teaser: "Próximo episodio: no pasa nada. Literalmente nada. Y aun así es de los favoritos de la crítica.",
  },
  {
    num: 4,
    title: "El episodio tranquilo",
    genre: "Bottle episode",
    unlockISO: "2026-07-19T05:00:00Z",
    accent: "#9a8fd1",
    synopsis: "Dos personajes, una locación, cero efectos especiales.",
    lockedHint: "Disponible el 19 de julio",
    // Interacción: scroll — el cielo se llena de estrellas mientras aparecen los fragmentos
    fragments: [
      "Un parque cerca de mi casa. De noche.",
      "Teníamos que comprar cosas para la reunión del grupo. Eso era el plan, al menos.",
      "Terminamos sentados en la máquina esa de hacer piernas, como si fuera una banca.",
      "Un heyfit cada uno. Nuestra bebida “favorita”, entre comillas gigantes.",
      "Hablamos de cosas que no se hablan con cualquiera. De las que habían dolido.",
      "Esa noche no pasó nada. Y a la vez pasó todo: esta amistad se volvió en serio.",
    ],
    quote: "Hay conversaciones que te ordenan la cabeza. Esa banca de parque tiene un lugar ganado en mi historia.",
    hiddenWord: "mi",
    teaser: "Próximo episodio: apocalipsis, hongos, y una persona sorprendentemente responsable.",
  },
  {
    num: 5,
    title: "Supervivencia",
    genre: "Postapocalíptico",
    unlockISO: "2026-07-20T05:00:00Z",
    accent: "#6fbf8e",
    synopsis: "En un mundo hostil, el inventario lo es todo.",
    lockedHint: "Disponible el 20 de julio",
    // Interacción: inventario de supervivencia — tocar cada objeto revela su historia
    items: [
      {
        icon: "🎮",
        name: "Un control",
        text: "The Last of Us. La historia que seguimos juntos: yo jugando en el directo, tú en el chat. Ese save file es de los dos.",
      },
      {
        icon: "🍾",
        name: "Una botella",
        text: "La fiesta de Gianfranco. Yo: fuera de combate. Tú: cuidando mis cosas y asegurándote de que no me lastimara. Nunca lo dije bien: gracias.",
      },
      {
        icon: "📦",
        name: "Suministros",
        text: "Dato de supervivencia comprobado: aguantar cualquier apocalipsis es más fácil cuando alguien te cuida la espalda.",
      },
      {
        icon: "💬",
        name: "Una señal de radio",
        text: "El chat diario. Contarse todo. Todos los días. Esa señal nunca se ha caído.",
      },
    ],
    quote: "Hay historias que solo quiero terminar si estoy bien acompañado.",
    hiddenWord: "quiero",
    teaser: "Se viene el doble final de temporada: Six... Seven. Ya sabes.",
  },
  {
    num: 6,
    title: "Six",
    genre: "Slice of life",
    unlockISO: "2026-07-21T05:00:00Z",
    accent: "#d98fb0",
    synopsis: "Primera parte del final de temporada. La rutina también cuenta historias.",
    lockedHint: "Disponible el 21 de julio",
    // Interacción: ecualizador que reacciona al toque mientras aparecen las líneas
    lines: [
      "Todos los días empiezan igual: “morning”.",
      "Y muchos terminan igual: estudiando con una jam de fondo.",
      "Arctic Monkeys, Sabrina, lo que caiga. En inglés, dizque para no distraernos.",
      "Nadie escribió esta rutina. Se escribió sola. Esas son las mejores.",
    ],
    quote: "Toda buena canción sabe dónde va la pausa, justo antes de la parte importante.",
    hiddenWord: ",",
    teaser: "Final de temporada: mañana a las 00:00. No llegues tarde.",
  },
  {
    num: 7,
    title: "Seven",
    genre: "Final de temporada",
    unlockISO: "2026-07-22T05:00:00Z",
    accent: "#e8a15c",
    synopsis: "Todo estaba conectado.",
    lockedHint: "Disponible el 22 de julio",
    // La revelación usa las tarjetas de los episodios 1-6.
    revealIntro: [
      "Antes del final, un resumen de la temporada.",
      "Cada episodio terminó con una tarjeta.",
      "Quizás no lo notaste, pero las tarjetas guardaban algo.",
      "Mira.",
    ],
    phrase: ["Quiero", "seguir", "mi", "vida", ",", "contigo"],
    phraseDisplay: "Quiero seguir mi vida, contigo.",
    finalMessage:
      "Ari.\n\n" +
      "Esto nunca fue una serie. Es solo nuestro último año, contado como me gusta recordarlo.\n\n" +
      "Ya sabes lo que te dije hace un tiempo. Sigue siendo verdad, pero con los días se volvió " +
      "algo más tranquilo y más serio a la vez. No es un crush que se pasa: es que me di cuenta " +
      "de que los mejores capítulos de mi año tenían algo en común.\n\n" +
      "No tienes que responder nada. No cambia nada de lo que somos si tú no quieres que cambie. " +
      "Solo quería que lo supieras de una forma que estuviera a tu altura.",
    credits: [
      "ELENCO",
      "Pequeña Ari — como ella misma",
      "Dylan — el que escribió todo esto",
      "Gianfranco, César, Ignacio — la mesa",
      "Un heyfit — bebida oficial de la temporada",
      "Las tortugas — apoyo emocional",
      "",
      "Escrita, dirigida y sentida por Dylan.",
    ],
  },
];
