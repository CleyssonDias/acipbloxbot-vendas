import { createResponder, ResponderType } from "#base";
import { createEmbed } from "@magicyan/discord";

createResponder({
    customId: "/store/cupom/:canal",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction) {
        let emd = createEmbed({
            description: `**${constants.emojis.sad} Não temos cupons criados!**`,
            color: constants.colors.danger,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })

        interaction.reply({ embeds: [emd]})


    },
});