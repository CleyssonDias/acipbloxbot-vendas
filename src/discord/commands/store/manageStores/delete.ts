import { db } from "#database";
import { createEmbed } from "@magicyan/discord";
import commad from "../commad.js";
import { ApplicationCommandOptionType } from "discord.js";

commad.subcommand({
    name: "deletar",
    description: "🏪 Deletar alguma loja!",
    options: [{
        name: "id",
        description: "🏪 Nome da loja",
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    async run(interaction) {
        const { options } = interaction
        const res = await interaction.deferReply()

        const id = options.getString("id")
        if (!id) return;

        const store = await db.store.find({
            nameid: id
        })

        if (store.length == 0) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} A Loja \`${id}\` não econtrada!**`,
                color: constants.colors.danger,
                timestamp: new Date(),
                footer: {
                    text: `Gerenciamento Lojas`,
                    iconURL: interaction.client.user.displayAvatarURL()
                }
            })
            res.edit({ embeds: [emd] })
            return
        }

        await db.store.deleteOne({
            nameid:id
        })

        let emd = createEmbed({
            description: `**${constants.emojis.ok} A Loja \`${id}\` foi deletada!**`,
            color: constants.colors.green,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })
    },
})