export const DIALOGUES = Object.freeze([
  {
    id: "favorite-things",
    title: "Capys Lieblingsdinge",
    memory: "Ihr habt über Glitzer, Ausflüge und einen perfekten Spieleabend gesprochen.",
    turns: [
      {
        prompt: "Ich mag Glitzer, Gesellschaft und unterwegs sein. Was machen wir bei unserem nächsten Ausflug?",
        choices: [
          { label: "Ein gemütliches Café suchen", response: "Oh ja! Ich nehme Hafer-Milchschaum und den Platz, an dem wir alle Leute sehen können.", changes: { social: 5, energy: 3 } },
          { label: "Glitzersteine am Teich sammeln", response: "Ich finde die funkelnden und du passt auf, dass ich vor Freude nicht hineinplumpse.", changes: { curiosity: 6, fun: 4 } },
          { label: "Einen Spieleladen besuchen", response: "Brettspiele! Ich wähle natürlich die glitzernde Figur und verliere ausgesprochen würdevoll.", changes: { fun: 6, social: 4 } },
        ],
      },
      {
        prompt: "Danach könnten wir grillen. Du weißt hoffentlich, was niemals auf meinen Teller kommt?",
        choices: [
          { label: "Zwiebeln – auf keinen Fall", response: "Du kennst mich! Diese runden Betrüger bleiben ganz weit weg von meiner Schnute.", changes: { social: 7, fun: 2 } },
          { label: "Nur Mais und Melone", response: "Knackig, süß und zwiebelfrei. Du bist eindeutig Grillmeister meines Herzens.", changes: { satiety: 3, social: 5 } },
          { label: "Ein Überraschungsteller", response: "Einverstanden – aber wir machen vorher gemeinsam die große Zwiebelkontrolle.", changes: { curiosity: 4, fun: 4 } },
        ],
      },
    ],
  },
  {
    id: "perfect-day",
    title: "Ein perfekter Capy-Tag",
    memory: "Ihr habt euren perfekten gemeinsamen Tag geplant.",
    turns: [
      {
        prompt: "Ich plane gerade unseren perfekten Tag. Womit sollen wir anfangen?",
        choices: [
          { label: "Mit Melone im Bett", response: "Du verstehst mich! Frühstücksmelone ist offiziell die gemütlichste Melone.", changes: { fun: 3, social: 4 } },
          { label: "Mit einem Abenteuer", response: "Jaaa! Ich packe Mut, Neugier und eine Notfallkarotte ein.", changes: { curiosity: 6, fun: 2 } },
          { label: "Mit langem Kuscheln", response: "Dann rücke ich jetzt schon mal ganz nah. Nur zum Üben.", changes: { social: 7, energy: 2 } },
        ],
      },
      {
        prompt: "Und wo schauen wir am Abend zusammen in den Himmel?",
        choices: [
          { label: "Am warmen Teich", response: "Das Wasser glitzert und du bist da. Besser kann ein Tag nicht enden.", changes: { social: 5, curiosity: 2 } },
          { label: "Auf einer Kuscheldecke", response: "Ich bringe meinen flauschigsten Bauch als Kopfkissen mit.", changes: { social: 6, energy: 2 } },
          { label: "In einem Melonenfeld", response: "Romantisch und essbar – das ist eindeutig die beste Art von Aussicht.", changes: { fun: 5, satiety: 2 } },
        ],
      },
    ],
  },
  {
    id: "missing-you",
    title: "Wenn du weg bist",
    memory: "Ihr habt darüber geredet, dass eure Freundschaft auch Pausen aushält.",
    turns: [
      {
        prompt: "Wenn du die App schließt, vermisse ich dich ein bisschen. Weißt du, was mir dann hilft?",
        choices: [
          { label: "An mich zu denken?", response: "Genau. Ich denke an dich und passe auf unser Zuhause auf.", changes: { social: 7 } },
          { label: "Ein Capy-Nickerchen?", response: "Sehr richtig. Im Traum kannst du mich jederzeit besuchen.", changes: { energy: 4, social: 3 } },
          { label: "Die Erinnerung an heute", response: "Die kommt direkt in mein Tagebuch. Gute Momente werden nicht kleiner, wenn man weggeht.", changes: { social: 6, curiosity: 2 } },
        ],
      },
      {
        prompt: "Was soll ich dir beim nächsten Wiedersehen zuerst sagen?",
        choices: [
          { label: "Ich hab dich vermisst", response: "Abgemacht. Und dann gibt es einen extra langen Willkommens-Kuschler.", changes: { social: 8 } },
          { label: "Schön, dass du da bist", response: "Das ist mein Lieblingssatz. Gleich nach: Hier ist deine Melone.", changes: { social: 6, fun: 2 } },
          { label: "Komm, wir spielen", response: "Dann stehe ich schon mit wackelnden Ohren am Start.", changes: { fun: 6, energy: -1 } },
        ],
      },
    ],
  },
  {
    id: "brave-capy",
    title: "Mutig sein",
    memory: "Emmi hat dir ihr kleines Geheimnis über Mut verraten.",
    turns: [
      {
        prompt: "Manchmal bin ich vor neuen Dingen aufgeregt. Was bedeutet mutig sein?",
        choices: [
          { label: "Es trotzdem versuchen", response: "Also darf mein Herz klopfen und ich kann trotzdem einen kleinen Schritt machen. Das gefällt mir.", changes: { curiosity: 7, social: 3 } },
          { label: "Jemanden dabeihaben", response: "Dann bist du mein Mut-Mensch. Zusammen sehen große Dinge gleich capy-klein aus.", changes: { social: 8 } },
          { label: "Sich Zeit lassen", response: "Sanfter Mut! Kein Rennen, kein Drängeln – nur ein Schritt, wenn er sich richtig anfühlt.", changes: { energy: 3, social: 4 } },
        ],
      },
      {
        prompt: "Welches kleine Abenteuer traust du uns heute zu?",
        choices: [
          { label: "Im Teich tauchen", response: "Blubb! Ich halte nach glitzernden Teichschätzen Ausschau.", changes: { curiosity: 6, fun: 3 } },
          { label: "Einen neuen Weg nehmen", response: "Ich schnuppere voraus. Meine Nase ist ein hervorragender Abenteuerkompass.", changes: { curiosity: 8 } },
          { label: "Heute einfach ausruhen", response: "Auch Pause machen kann mutig sein. Dann bewachen wir gemeinsam die Kuscheldecke.", changes: { energy: 5, social: 3 } },
        ],
      },
    ],
  },
  {
    id: "dreams",
    title: "Capy-Träume",
    memory: "Ihr habt euch einen besonders schönen Traum ausgedacht.",
    turns: [
      {
        prompt: "Letzte Nacht konnte ich im Traum fliegen. Was glaubst du, wie sahen meine Flügel aus?",
        choices: [
          { label: "Wie kleine Wolken", response: "Weich, rund und ein bisschen langsam – perfekte Capy-Flügel.", changes: { fun: 5, energy: 3 } },
          { label: "Aus Melonenschalen", response: "Praktisch! Bei einer Flugpause kann ich einfach meine Flügel aufessen.", changes: { fun: 7, satiety: 2 } },
          { label: "Golden und glitzernd", response: "Dann habe ich über dem Teich bestimmt wie ein kleiner Sonnenstrahl geleuchtet.", changes: { curiosity: 5, fun: 3 } },
        ],
      },
      {
        prompt: "Wohin sollen wir heute Nacht im Traum reisen?",
        choices: [
          { label: "Zum Mond", response: "Ich habe gehört, dort sind die Krater perfekte Capy-Badewannen.", changes: { curiosity: 7 } },
          { label: "Ans Meer", response: "Du, ich und tausend kleine Wellen. Ich nehme das Handtuch mit.", changes: { social: 5, curiosity: 3 } },
          { label: "In unser Zuhause", response: "Der schönste Traumort ist manchmal genau da, wo man sich sicher fühlt.", changes: { social: 7, energy: 3 } },
        ],
      },
    ],
  },
  {
    id: "friendship",
    title: "Was Freunde können",
    memory: "Emmi und du habt besprochen, was eure Freundschaft besonders macht.",
    turns: [
      {
        prompt: "Was magst du am liebsten daran, dass wir Freunde sind?",
        choices: [
          { label: "Dass du mich zum Lachen bringst", response: "Dann trainiere ich weiter meinen berühmten Capy-Wackelohren-Witz.", changes: { fun: 7, social: 3 } },
          { label: "Dass wir uns kümmern", response: "Du achtest auf mich und ich erinnere dich ans Durchatmen. Gutes Team.", changes: { social: 8 } },
          { label: "Dass wir Neues erleben", response: "Mit dir fühlt sich Neugier warm und sicher an. Das ist ziemlich besonders.", changes: { curiosity: 6, social: 4 } },
        ],
      },
      {
        prompt: "Was soll unser geheimes Freundschaftszeichen sein?",
        choices: [
          { label: "Zweimal Nasenstups", response: "Stups, stups! Jetzt ist es offiziell und streng geheim.", changes: { social: 6, fun: 3 } },
          { label: "Ein Melonen-Codewort", response: "Codewort: Mmmelone. Unauffälliger geht es wirklich nicht.", changes: { fun: 6, satiety: 1 } },
          { label: "Ein kleines Herz", response: "Das trage ich ab jetzt unsichtbar hinter meinem linken Ohr.", changes: { social: 8 } },
        ],
      },
    ],
  },
  {
    id: "feelings",
    title: "Wie war dein Tag?",
    memory: "Emmi hat dir zugehört und war einfach für dich da.",
    turns: [
      {
        prompt: "Wie fühlt sich dein Tag heute an? Ich höre zu, ohne zu urteilen.",
        choices: [
          { label: "Leicht und schön", response: "Dann freue ich mich mit dir! Lass uns den schönen Moment kurz festhalten.", changes: { fun: 5, social: 5 } },
          { label: "Ganz schön anstrengend", response: "Dann musst du hier nichts leisten. Atme kurz mit mir ein … und wieder aus.", changes: { energy: 4, social: 7 } },
          { label: "Irgendwie gemischt", response: "Gemischte Gefühle dürfen nebeneinander sitzen. Bei mir ist genug Platz für alle.", changes: { social: 7, curiosity: 2 } },
        ],
      },
      {
        prompt: "Was würde dir jetzt guttun?",
        choices: [
          { label: "Ein ruhiger Moment", response: "Dann sind wir einfach kurz still zusammen. Ich bleibe hier.", changes: { energy: 5, social: 5 } },
          { label: "Etwas Albernes", response: "Achtung: Ich erkläre diesen Po offiziell zum rundesten Po des Tages.", changes: { fun: 8 } },
          { label: "Ein virtueller Kuschler", response: "Kommt sofort – warm, weich und ohne Zeitlimit.", changes: { social: 9 } },
        ],
      },
    ],
  },
]);

export function dialogueFor(state) {
  if (state.social < 38) return DIALOGUES.find((dialogue) => dialogue.id === "missing-you");
  if (state.curiosity < 38) return DIALOGUES.find((dialogue) => dialogue.id === "brave-capy");
  if (state.energy < 32) return DIALOGUES.find((dialogue) => dialogue.id === "dreams");
  const index = Math.abs(Math.floor(state.interactions + state.xp)) % DIALOGUES.length;
  return DIALOGUES[index];
}
