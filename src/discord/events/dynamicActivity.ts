import { createEvent } from "#base";
import { ActivityType, Client } from "discord.js";

// Lista de frases chamativas para a atividade do bot
const activityMessages = [
  "👀 esperando você comprar na loja!",
  "🎁 ofertas especiais só hoje!",
  "🛒 visite a Luna Loja Poker agora!",
  "💸 aproveite e garanta seu item!",
  "🔥 promoções imperdíveis na loja!",
  "✨ clique e confira nossos produtos!"
];

let activityIndex = 0;

export default createEvent({
  name: "dynamicActivity",
  event: "clientReady",
  async run(client: Client) {
    // Função para atualizar a atividade periodicamente
    function updateActivity() {
      const message = activityMessages[activityIndex];
      client.user?.setActivity(message, { type: ActivityType.Watching });
      activityIndex = (activityIndex + 1) % activityMessages.length;
    }
    // Atualiza imediatamente e depois a cada 15 segundos
    updateActivity();
    setInterval(updateActivity, 15000);
  }
});
