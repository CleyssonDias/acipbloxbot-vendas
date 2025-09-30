import { createResponder, ResponderType } from "#base";
import { createEmbed } from "@magicyan/discord";
import { ButtonInteraction } from "discord.js";
import { getOrderById, setOrderModerator } from "../../../../database/orders.js";

createResponder({
    customId: "/store/pegarpedido/:channel/:id",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction: ButtonInteraction, params) {
        await interaction.deferReply({ ephemeral: true });
        const channelParam = params.channel;
        const orderId = params.id;
        if (!channelParam || !orderId) {
            await interaction.editReply({ content: 'Parâmetros inválidos.' });
            return;
        }

        try {
            const channel = interaction.guild?.channels.cache.get(channelParam as string);
            if (!channel) {
                await interaction.editReply({ content: 'Canal de entrega não encontrado.' });
                return;
            }

            // marcar que este moderador pegou o pedido (salvar em DB)
            await setOrderModerator(orderId, interaction.user.id);

            // buscar dados do pedido (client guild/channel) a partir do DB
            const order: any = await getOrderById(orderId);
            let clientChannel: any = null;
            if (order && order.clientGuildId && order.clientChannelId) {
                const clientGuild = interaction.client.guilds.cache.get(order.clientGuildId as string);
                clientChannel = clientGuild?.channels.cache.get(order.clientChannelId as string) ?? null;
            }

            const embed = createEmbed({
                title: 'Pedido assumido',
                description: `O moderador <@${interaction.user.id}> assumiu o pedido **${orderId}**.`,
                color: constants.colors.success,
                timestamp: new Date(),
                footer: { text: 'Genciamento de Entregas', iconURL: interaction.user.displayAvatarURL() }
            });

            await interaction.editReply({ embeds: [embed] });

            if (clientChannel && 'send' in clientChannel && typeof (clientChannel as any).send === 'function') {
                await (clientChannel as any).send({ content: `O moderador <@${interaction.user.id}> pegou o seu pedido e em breve entrará em contato.` });
            }

            return;
        } catch (err) {
            console.error('[pegarpedido] erro', err);
            await interaction.editReply({ content: 'Erro ao processar ação.' });
            return;
        }
    }
});
