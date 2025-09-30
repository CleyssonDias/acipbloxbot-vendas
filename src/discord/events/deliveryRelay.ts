import { createEvent } from "#base";
import { createEmbed } from "@magicyan/discord";
import { Message } from "discord.js";
import { getOrderById } from "../../database/orders.js";

createEvent({
  name: "deliveryRelay",
  event: "messageCreate",
  async run(message: Message) {
    try {
      if (!message.guild || message.author.bot) return;

      const channel = message.channel;
      if (!("name" in channel) || typeof (channel as any).name !== "string") return;

      const channelName = (channel as any).name as string;
      if (!channelName.startsWith("📦-pedido-")) return;

      const id = channelName.replace("📦-pedido-", "");
      if (!id) return;

      const orderRaw = await getOrderById(id);
      const order = orderRaw as any;
      if (!order) return;


      // Só encaminhar se a mensagem vier do guild do cliente
      if (!order.clientGuildId || message.guild.id !== order.clientGuildId) return;

      // Buscar o canal de entrega (serverTwo)
      const serverTwo = order.deliveryGuildId ? message.client.guilds.cache.get(order.deliveryGuildId) : null;
      if (!serverTwo) return;
      const targetChannel = order.deliveryChannelId
        ? serverTwo.channels.cache.get(order.deliveryChannelId)
        : serverTwo.channels.cache.find((c) => "name" in c && (c as any).name === channelName && "send" in c);
      if (!targetChannel) return;

      // Montar embed bonito do cliente
      const files = Array.from(message.attachments.values());
      const embed = createEmbed({
        author: {
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        },
        title: `Mensagem do Cliente`,
        description: message.content || "*(sem texto)*",
        color: constants.colors.primary,
        timestamp: new Date(),
        footer: { text: `ID do Pedido: ${id}` },
      });

      // Só menciona o moderador se existir
      const mention = order.moderatorId ? `<@${order.moderatorId}>` : undefined;
      if ("send" in targetChannel && typeof (targetChannel as any).send === "function") {
        await (targetChannel as any).send({ content: mention, embeds: [embed], files });
      }
      return;
    } catch (err) {
      console.error("[deliveryRelay] erro:", err);
    }
  },
});
