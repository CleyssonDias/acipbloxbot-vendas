import { createResponder, ResponderType } from "#base";
import { createEmbed } from "@magicyan/discord";
import { ButtonInteraction } from "discord.js";
import { getOrderById, updateOrder } from "../../../../database/orders.js";

createResponder({
    customId: "/store/marcarAusente/:channel",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction: ButtonInteraction, params) {
        await interaction.deferReply({ ephemeral: true });
        const channelParam = params.channel;
        if (!channelParam) {
            await interaction.editReply({ content: 'Parâmetros inválidos.' });
            return;
        }
        try {
            const channel = interaction.guild?.channels.cache.get(channelParam as string);
            if (!channel) {
                await interaction.editReply({ content: 'Canal de entrega não encontrado.' });
                return;
            }

            const embed = createEmbed({
                title: 'Marcar Ausente',
                description: `O pedido foi marcado como ausente pelo moderador <@${interaction.user.id}>.`,
                color: constants.colors.warning,
                timestamp: new Date(),
                footer: { text: 'Genciamento de Entregas', iconURL: interaction.user.displayAvatarURL() }
            });

            // mover canal para categoria de ausentes no serverTwo (se aplicável)
            try {
                const ausenteCategoryId = constants.categorys.serverTwo.ausentecategory;
                if ('setParent' in channel && typeof (channel as any).setParent === 'function') {
                    await (channel as any).setParent(ausenteCategoryId, { lockPermissions: false });
                }
            } catch (e) {
                console.error('[marcarAusente] erro ao mover canal para ausentes', e);
            }

            // notificar cliente se possível via DB
            try {
                const orderId = ('name' in channel && typeof (channel as any).name === 'string') ? (channel as any).name.replace('📦-pedido-', '') : '';
                const order: any = await getOrderById(orderId);
                if (order && order.clientGuildId && order.clientChannelId) {
                    const clientGuild = interaction.client.guilds.cache.get(order.clientGuildId as string);
                    const clientChannel = clientGuild?.channels.cache.get(order.clientChannelId as string);
                    if (clientChannel && 'send' in clientChannel && typeof (clientChannel as any).send === 'function') {
                        await (clientChannel as any).send({ content: `Seu pedido foi marcado como ausente. Entraremos em contato.` });
                        try { await updateOrder(orderId, { status: 'absent' }); } catch(e){ console.error('[marcarAusente] erro atualizar ordem', e); }
                    }
                }
            } catch (e) {
                console.error('[marcarAusente] erro ao notificar cliente', e);
            }

            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (err) {
            console.error('[marcarAusente] erro', err);
            await interaction.editReply({ content: 'Erro ao marcar ausente.' });
            return;
        }
    }
});
