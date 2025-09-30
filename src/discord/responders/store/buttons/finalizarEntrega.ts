import { createResponder, ResponderType } from "#base";
import { createEmbed } from "@magicyan/discord";
import { ButtonInteraction } from "discord.js";
import { getOrderById, updateOrder } from "../../../../database/orders.js";

createResponder({
    customId: "/store/finalizarEntrega/:channel",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction: ButtonInteraction, params) {
        await interaction.deferReply({ ephemeral: true });
        const channelParam = params.channel;
        if (!channelParam) {
            await interaction.editReply({ content: 'Parâmetros inválidos.' });
            return;
        }
        try {
            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply({ content: 'Ambiente inválido.' });
                return;
            }
            const channel = guild.channels.cache.get(channelParam as string);
            if (!channel) {
                await interaction.editReply({ content: 'Canal não encontrado.' });
                return;
            }

            // mover o canal para a categoria finalizados no mesmo guild
            const finalCategoryId = constants.categorys.serverTwo.finalizadosCategory;
            // apenas canais de guild (TextChannel/Thread) têm setParent
            if ('setParent' in channel && typeof (channel as any).setParent === 'function') {
                await (channel as any).setParent(finalCategoryId, { lockPermissions: false });
            } else if ('parent' in channel) {
                // não é possível setar parent: ignorar
                console.warn('[finalizarEntrega] canal não suporta setParent, ignorando.');
            }

            // notificar cliente no canal do cliente (mesmo nome)
            const orderId = ('name' in channel && typeof (channel as any).name === 'string') ? (channel as any).name.replace('📦-pedido-', '') : '';
            // usar DB para localizar client channel
            const order: any = await getOrderById(orderId);
            if (order && order.clientGuildId && order.clientChannelId) {
                const clientGuild = interaction.client.guilds.cache.get(order.clientGuildId as string);
                const clientChannel = clientGuild?.channels.cache.get(order.clientChannelId as string);
                if (clientChannel && 'send' in clientChannel && typeof (clientChannel as any).send === 'function') {
                    const embed = createEmbed({
                        title: `${constants.emojis.ok} Pedido finalizado!`,
                        description: `# Seu pedido foi finalizado com sucesso!\n\nMuito obrigado por comprar conosco! Se possível, avalie nosso atendimento deixando seu feedback.\n\nSe precisar de algo, estamos à disposição!`,
                        color: constants.colors.success,
                        timestamp: new Date(),
                        footer: { text: 'Equipe AcipBlox', iconURL: interaction.client.user.displayAvatarURL() }
                    });
                    await (clientChannel as any).send({ embeds: [embed] });
                    // atualizar status no DB
                    try { await updateOrder(orderId, { status: 'finished' }); } catch (e) { console.error('[finalizarEntrega] erro atualizar ordem', e); }
                    setTimeout(async () => {
                        try {
                            if ('delete' in clientChannel && typeof (clientChannel as any).delete === 'function') {
                                await (clientChannel as any).delete();
                            }
                        } catch (e) { console.error('[finalizarEntrega] erro deletar client channel', e); }
                    }, 10 * 1000);
                }
            }

            const embed = createEmbed({
                title: 'Pedido finalizado',
                description: `O pedido foi marcado como finalizado e movido para finalizados.`,
                color: constants.colors.success,
                timestamp: new Date(),
                footer: { text: 'Genciamento de Entregas', iconURL: interaction.user.displayAvatarURL() }
            });
            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (err) {
            console.error('[finalizarEntrega] erro', err);
            await interaction.editReply({ content: 'Erro ao finalizar pedido.' });
            return;
        }
    }
});
