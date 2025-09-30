import { createResponder, ResponderType } from "#base";
import { createEmbed } from "@magicyan/discord";
import { ButtonInteraction } from "discord.js";

createResponder({
    customId: "/store/pix/confirm/:id",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction: ButtonInteraction, params) {
        await interaction.deferReply({ ephemeral: true });
        const id = params.id;
        if (!id) {
            await interaction.editReply({ content: 'Parâmetros inválidos.' });
            return;
        }
        try {
            // Ação de confirmação: atualmente apenas notifica e registra um log; você pode adicionar atualização em DB aqui
            (globalThis as any)._orderConfirmed = (globalThis as any)._orderConfirmed || {};
            (globalThis as any)._orderConfirmed[id] = { confirmedAt: Date.now(), by: interaction.user.id };

            const embed = createEmbed({
                title: 'Pagamento confirmado',
                description: `O pagamento da cobrança **${id}** foi confirmado por <@${interaction.user.id}>.`,
                color: constants.colors.success,
                timestamp: new Date(),
                footer: { text: 'Genciamento de Entregas', iconURL: interaction.user.displayAvatarURL() }
            });

            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (err) {
            console.error('[pegarpedido_confirm] erro', err);
            await interaction.editReply({ content: 'Erro ao confirmar pagamento.' });
            return;
        }
    }
});
