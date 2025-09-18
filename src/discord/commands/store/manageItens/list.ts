import { db } from "#database";
import { createEmbed } from "@magicyan/discord";
import { ApplicationCommandOptionType } from "discord.js";
import groupItens from "./groupItens.js";

groupItens.subcommand({
    name: "listar",
    description: "🏪 Listar itens da loja",
    options: [
        {
            name: "iddaloja",
            description: "🏪 Nome unico da loja",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    async run(interaction) {
        const { options } = interaction
        const res = await interaction.deferReply({
            flags:['Ephemeral']
        })
        const iddaloja = options.getString("iddaloja");
        if (!iddaloja) return;
        const itens = await db.store.find({
            nameid: iddaloja
        })
        if (itens.length == 0) {
          let emd = createEmbed({
                description: `**${constants.emojis.cancel} A Loja \`${iddaloja}\` não existe!**`,
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

        if (itens[0].itens.length == 0) {
            let emd = createEmbed({
                title: `${constants.emojis.folder} Itens da Loja \`${iddaloja}\`:`,
                description: `**${constants.emojis.sad} A Loja \`${iddaloja}\` não possui itens!**`,
                color: constants.colors.azoxo,
                timestamp: new Date(),
                footer: {
                    text: `Gerenciamento Lojas`,
                    iconURL: interaction.client.user.displayAvatarURL()
                }
            })
            res.edit({ embeds: [emd] })
            return
        }

        let emd = createEmbed({
            title: `${constants.emojis.folder} Itens da Loja \`${iddaloja}\`:`,
            description: itens[0].itens.map(i => `**${constants.emojis.paper} \`${i.name}\` - \`${i.title}\` - \`R$${i.value.toLocaleString()}\` - \`${i.stock} em estoque\`**`).join("\n"),
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })
    }
})