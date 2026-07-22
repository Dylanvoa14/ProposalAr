/* ============================================================
   LA MESA — Temporada 1
   TODO EL CONTENIDO EDITABLE ESTÁ EN ESTE ARCHIVO.
   Dylan: cambia textos aquí sin tocar app.js ni index.html.
   Orden cronológico real: origen → parque → Friday's → cine →
   fiesta/TLOU → presente → final.
   ============================================================ */

const CONFIG = {
  // Modo desarrollador: abre la web con ?dev=lamesa67 para desbloquear
  // todo y probar. Con ?dev=off se desactiva.
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

  heroTag: "serie original · para una sola espectadora",
  heroMeta: "2026 · 7 episodios · estreno diario a las 00:00",
  heroSynopsis: "Una serie sobre un grupo que no sabía que era una serie.",
};

/* Cada episodio se desbloquea a las 00:00 hora de Lima (UTC-5).
   Las fechas están en UTC: 00:00 Lima = 05:00 UTC. */

const EPISODES = [
  /* ------------------------------------------------------------
     E1 · PILOTO — el origen. Partido de ping pong continuo:
     cada devolución de ella escribe un capítulo, sin cortar el juego.
     ------------------------------------------------------------ */
  {
    num: 1,
    title: "Piloto",
    genre: "El origen",
    duration: "≈ 3 min",
    unlockISO: "2026-07-16T05:00:00Z",
    accent: "#7fb4c9",
    synopsis: "Cuatro tipos, una mesa de ping pong y una interrupción no solicitada.",
    lockedHint: "Disponible el 16 de julio",
    type: "pong",
    intro: "Esta historia se cuenta jugando. Devuelve la pelota.",
    vignettes: [
      "Había una vez cuatro tipos y una mesa de ping pong: Gianfranco, César, Ignacio y yo. Grupo cerrado. Solo ping pong.",
      "Un día, un grupo de chicas se acercó a jugar. Spoiler: no fue por el ping pong.",
      "Fue porque a una de ellas le gustaba Ignacio. En serio. Así de random empezó todo.",
      "Poco a poco los dos grupos se volvieron uno. Nadie lo decidió: simplemente pasó.",
      "Y en ese grupo venía una niña que, sin que nadie lo planeara, se iba a volver mi mejor amiga.",
    ],
    endText: "Fin del piloto.",
    quote: "A veces la vida te cambia de mesa sin avisar.",
    hiddenWord: "vida",
    teaser: "Próximo episodio: dos personajes, un parque, cero efectos especiales. El favorito de la crítica.",
  },

  /* ------------------------------------------------------------
     E2 · EL EPISODIO TRANQUILO — el parque, la primera
     conversación real (cronológicamente antes que todo lo demás)
     ------------------------------------------------------------ */
  {
    num: 2,
    title: "El episodio tranquilo",
    genre: "Bottle episode",
    duration: "≈ 3 min",
    unlockISO: "2026-07-17T05:00:00Z",
    accent: "#9a8fd1",
    synopsis: "Dos personajes, una locación. No pasa nada. Pasa todo.",
    lockedHint: "Disponible el 17 de julio",
    type: "park",
    hint: "desliza despacio · la noche avanza contigo",
    fragments: [
      "Un parque cerca de mi casa. De noche.",
      "El plan era simple: comprar cosas para la reunión del grupo. Eso era todo el guion.",
      "Pero terminamos sentados en la máquina esa de hacer piernas, como si fuera una banca.",
      "Un heyfit cada uno. Nuestra bebida “favorita”, entre comillas gigantes.",
      "Hablamos de las cosas que habían dolido. De los ex. De lo que no se cuenta a cualquiera.",
      "Días después llegó la reunión. Hubo baile. Dato aparentemente irrelevante. Los buenos guiones no desperdician escenas.",
      "Esa noche en el parque no pasó nada. Y a la vez pasó todo: esta amistad se volvió en serio.",
    ],
    quote: "Hay conversaciones que te ordenan la cabeza. Esa banca tiene un lugar ganado en mi historia.",
    hiddenWord: "mi",
    teaser: "Próximo episodio: grabado frente a un público en vivo (nosotros mismos). Alguien jura que come un montón.",
  },

  /* ------------------------------------------------------------
     E3 · EN EL QUE NOS DOLIÓ LA BARRIGA — Friday's
     ------------------------------------------------------------ */
  {
    num: 3,
    title: "En el que nos dolió la barriga",
    genre: "Sitcom",
    duration: "≈ 3 min",
    unlockISO: "2026-07-18T05:00:00Z",
    accent: "#e5c46b",
    synopsis: "Grabado frente a un público en vivo. El público somos nosotros.",
    lockedHint: "Disponible el 18 de julio",
    type: "sitcom",
    hint: "cuando se encienda el letrero, toca rápido para reír",
    scenes: [
      "INT. FRIDAY'S — NOCHE.\nElenco completo en mesa para dos. Presupuesto: cuestionable.",
      "ELLA (con total seriedad): “Tengo hambre. Voy a comer UN MONTÓN.”\nPalabras textuales. Que conste en acta.",
      "CORTE A: el plato, casi intacto, mirando a cámara.\nEl jurado tiene su veredicto: comió tres papas y media.",
      "No recuerdo ni la mitad de las cosas de las que nos reímos esa noche. Nadie las recuerda. Así son las mejores.",
      "Solo sé que al día siguiente me seguía doliendo la barriga. De reírme. Eso no pasa con cualquiera.",
    ],
    quote: "Hay risas que te dejan doliendo la barriga hasta el día siguiente. Las mejores fueron contigo.",
    hiddenWord: "contigo",
    teaser: "Próximo episodio: alguien pasa mucho miedo en una sala de cine. No diremos quién. (Fue ella.)",
  },

  /* ------------------------------------------------------------
     E4 · LOS PASILLOS — el cine, Backrooms
     ------------------------------------------------------------ */
  {
    num: 4,
    title: "Los pasillos",
    genre: "Terror",
    duration: "≈ 3 min",
    unlockISO: "2026-07-19T05:00:00Z",
    accent: "#c9d64f",
    synopsis: "Este episodio se ve mejor con las luces apagadas.",
    lockedHint: "Disponible el 19 de julio",
    type: "hall",
    hint: "mueve el dedo para iluminar · encuentra los 4 recuerdos",
    wallTexts: [
      "Fuimos al cine a ver Backrooms.",
      "Alguien dijo que las películas de terror no le daban miedo.",
      "Ese alguien se asustó. Bastante. Hay testigos.",
      "Y yo, como buen mejor amigo, la fastidié por eso durante semanas. Cero arrepentimiento.",
    ],
    exitLabel: "SALIDA",
    quote: "Al final no importaba encontrar la salida. Importaba seguir caminando acompañado.",
    hiddenWord: "seguir",
    teaser: "Próximo episodio: apocalipsis, hongos, y una persona sorprendentemente responsable.",
  },

  /* ------------------------------------------------------------
     E5 · SUPERVIVENCIA — fiesta de Gianfranco + The Last of Us
     Minijuego: rondas de infectados que ella elimina tocándolos.
     Cada ronda limpia asegura un suministro con su historia.
     ------------------------------------------------------------ */
  {
    num: 5,
    title: "Supervivencia",
    genre: "Postapocalíptico",
    duration: "≈ 4 min",
    unlockISO: "2026-07-20T05:00:00Z",
    accent: "#6fbf8e",
    synopsis: "En un mundo hostil, el inventario lo es todo.",
    lockedHint: "Disponible el 20 de julio",
    type: "survival",
    hint: "toca a los infectados antes de que lleguen al campamento",
    enemy: "🧟",
    waves: [
      {
        count: 4,
        icon: "🎮",
        name: "Un control",
        text: "The Last of Us. La historia que seguimos juntos: yo jugando en el directo, tú en el chat. Ese save file es de los dos.",
      },
      {
        count: 5,
        icon: "🍾",
        name: "Una botella",
        text: "La fiesta de Gianfranco. Yo: fuera de combate. Tú: cuidando mis cosas y asegurándote de que no me lastimara. Nunca lo dije bien: gracias.",
      },
      {
        count: 6,
        icon: "🎒",
        name: "Suministros",
        text: "Dato de supervivencia comprobado: aguantar cualquier apocalipsis es más fácil cuando alguien te cuida la espalda.",
      },
      {
        count: 7,
        icon: "📻",
        name: "Una señal de radio",
        text: "El chat diario. Contarse todo. Todos los días. Esa señal nunca se ha caído.",
      },
    ],
    chat: [
      "buen intento, igual te van a morder",
      "JAJAJAJA",
      "cuidado por la izquierda",
      "no gastes las balas 😤",
      "esa parte da miedito",
      "otra vez moriste???",
      "ya casi, tú puedes",
      "seguimos mañana? 👀",
    ],
    chatUser: "ari",
    quote: "Hay historias que solo quiero terminar si estoy bien acompañado.",
    hiddenWord: "quiero",
    teaser: "Se viene el doble final de temporada: Six... Seven. Ya sabes.",
  },

  /* ------------------------------------------------------------
     E6 · SIX — el presente: morning, jam, rutina.
     LA MELODÍA INCOMPLETA: seis cuerdas afinadas para tocar una
     melodía que queda en el aire — le falta su última nota.
     La séptima cuerda está bloqueada: llega mañana, con el E7.
     (Y en el E7, cuando la frase se revela, la melodía por fin
     se completa y resuelve. El sonido ES la historia.)
     ------------------------------------------------------------ */
  {
    num: 6,
    title: "Six",
    genre: "Slice of life",
    duration: "≈ 3 min",
    unlockISO: "2026-07-21T05:00:00Z",
    accent: "#d98fb0",
    synopsis: "Primera parte del final de temporada. La rutina también suena.",
    lockedHint: "Disponible el 21 de julio",
    type: "jam",
    hint: "rasguea de izquierda a derecha · con sonido 🔊",
    introLines: [
      "Todos los días empiezan igual: “morning”. Y muchos terminan igual: una jam para estudiar. Arctic Monkeys, Sabrina, lo que caiga.",
      "Nuestra rutina tiene banda sonora. La afiné aquí, en seis cuerdas. Tócala.",
    ],
    afterStrum:
      "¿La escuchaste? La melodía sube… y se queda en el aire. No termina.",
    afterStrum2:
      "No está rota. Está incompleta: le falta su última nota. Y la última nota no vive en este episodio.",
    seventhLabel: "La nota que falta se estrena mañana, a las 00:00.",
    lockedStringHint: "mañana",
    quote: "Toda buena canción sabe dónde va la pausa, justo antes de la parte importante.",
    hiddenWord: ",",
    teaser: "Final de temporada: mañana a las 00:00. Trae la última nota.",
  },

  /* ------------------------------------------------------------
     E7 · SEVEN — final de temporada (la revelación)
     ------------------------------------------------------------ */
  {
    num: 7,
    title: "Seven",
    genre: "Final de temporada",
    duration: "el que necesites",
    unlockISO: "2026-07-22T05:00:00Z",
    accent: "#e8a15c",
    synopsis: "Todo estaba conectado.",
    lockedHint: "Disponible el 22 de julio",
    type: "finale",
    revealIntro: [
      "Antes del final, un resumen de la temporada.",
      "Cada episodio terminó con una tarjeta.",
      "Quizás no lo notaste, pero las tarjetas guardaban algo.",
      "Mira.",
    ],
    phraseDisplay: "Quiero seguir mi vida, contigo.",
    noteLine: "¿Recuerdas la nota que faltaba? Es esta.",
    finalMessage:
      "Ari.\n\n" +
      "Esto nunca fue una serie. Es solo nuestro último año, contado como me gusta recordarlo.\n\n" +
      "Ya sabes lo que te dije hace un tiempo. Sigue siendo verdad, pero con los días se volvió " +
      "algo más tranquilo y más serio a la vez. No es un crush que se pasa... es que me di cuenta " +
      "de que los mejores capítulos de mi año, tenían algo en común.\n\n" +
      "No tienes que responder nada. No cambia nada de lo que somos si tú no quieres que cambie. " +
      "Solo quería que lo supieras de una forma que estuviera a tu altura (JAJAJA altura).",
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
/* fin del contenido */
