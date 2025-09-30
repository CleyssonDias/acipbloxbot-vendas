import { createEvent } from "#base";
import { createEmbed } from "@magicyan/discord";
import { Message } from "discord.js";
import { getOrderById } from "../../database/orders.js";

createEvent({
    name: "relayToClient",
    event: "messageCreate",
    async run(message: Message) {
        try {
            if (!message.guild || message.author.bot) return;

            const channel = message.channel;
            if (!("name" in channel) || typeof (channel as any).name !== "string") return;
            const channelName = (channel as any).name as string;
            if (!channelName.startsWith("📦-pedido-")) return;

            const orderId = channelName.replace("📦-pedido-", "");
            if (!orderId) return;

            const orderRaw = await getOrderById(orderId);
            const order = orderRaw as any;
            if (!order) return;

            // localizar canal alvo (serverTwo)
            const serverTwo = order.deliveryGuildId ? message.client.guilds.cache.get(order.deliveryGuildId) : message.guild;
            if (!serverTwo) return;
            const targetChannel = order.deliveryChannelId
                ? serverTwo.channels.cache.get(order.deliveryChannelId)
                : serverTwo.channels.cache.find((c) => "name" in c && (c as any).name === channelName && "send" in c);
            if (!targetChannel) return;

            // restaurar canal de ausentes para entrega se necessário
            try {
                const ausenteCategoryId = constants.categorys.serverTwo.ausentecategory;
                const entregaCategoryId = constants.categorys.serverTwo.entregaCategory;
                const parentId = ("parentId" in targetChannel) ? (targetChannel as any).parentId : (targetChannel as any).parent?.id;
                if (parentId && parentId === ausenteCategoryId) {
                    if ("setParent" in targetChannel && typeof (targetChannel as any).setParent === "function") {
                        await (targetChannel as any).setParent(entregaCategoryId, { lockPermissions: false });
                    }
                }
            } catch (e) {
                console.error("[relayToClient] erro ao restaurar canal de ausentes para entrega", e);
            }

            // se autor é o moderador -> enviar para o cliente
            if (message.author.id === order.moderatorId) {
                if (!order.clientGuildId || !order.clientChannelId) return;
                const clientGuild = message.client.guilds.cache.get(order.clientGuildId);
                if (!clientGuild) return;
                const clientChannel = clientGuild.channels.cache.get(order.clientChannelId);
                if (!clientChannel) return;
                const attachments = Array.from(message.attachments.values()).map((a) => ({ name: a.name || "file", url: a.url }));
                const embed = createEmbed({
                    title: "Mensagem do moderador",
                    description: message.content || "*(sem texto)*",
                    color: constants.colors.secondary,
                    timestamp: new Date(),
                    footer: { text: `Moderador: ${message.author.tag} • via bot`, iconURL: message.author.displayAvatarURL() },
                });
                await (clientChannel as any).send({ content: `<@${order.clientUserId || ''}>`, embeds: [embed], files: attachments });
                return;
            }

            // se autor não é moderador e mensagem veio do client guild, encaminhar para delivery
            if (message.guild.id === order.clientGuildId) {
                const attachments = Array.from(message.attachments.values()).map((a) => ({ name: a.name || "file", url: a.url }));
                const embed = createEmbed({
                    title: "Mensagem do cliente",
                    description: message.content || "*(sem texto)*",
                    color: constants.colors.primary,
                    timestamp: new Date(),
                    footer: { text: `Cliente: ${message.author.tag} • via bot`, iconURL: message.author.displayAvatarURL() },
                });
                await (targetChannel as any).send({ content: order.moderatorId ? `<@${order.moderatorId}>` : undefined, embeds: [embed], files: attachments });
                return;
            }

        } catch (err) {
            console.error("[relayToClient] erro", err);
        }
    },
});
