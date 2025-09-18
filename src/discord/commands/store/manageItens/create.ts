import { db } from "#database";
import { createEmbed } from "@magicyan/discord";
import { ApplicationCommandOptionType } from "discord.js";
import groupItens from "./groupItens.js";

groupItens.subcommand({
    name: "criar",
    description: "🏪 Criar item",
    options: [
        {
            name: "iddaloja",
            description: "🏪 Nome unico da loja",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "iddoitem",
            description: "🏪 Nome unico do item",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "title",
            description: "🏪 Titulo do item",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "description",
            description: "🏪 Descrição do item",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "value",
            description: "🏪 Valor do item",
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "stock",
            description: "🏪 Estoque inicial do item",
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
    ],
    async run(interaction) {
        const res = await interaction.deferReply({
            flags:['Ephemeral']
        })
        const { options } = interaction

        const idloja = options.getString("iddaloja");
        const iditem = options.getString("iddoitem");
        const title = options.getString("title");
        const description = options.getString("description");
        const value = options.getNumber("value");
        const estoque = options.getNumber("stock");

        if (!idloja || !iditem || !title || !description || !value || !estoque) return;

        const loja = await db.store.find({
            nameid: idloja
        })

        if (loja.length == 0) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} A Loja \`${idloja}\` não existe!**`,
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


        var isItem = loja[0].itens.some(i => i.name == iditem)

        if (isItem) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} O \`${iditem}\` ja existe na loja \`${idloja}\`!**`,
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

        await db.store.updateOne({ nameid: idloja },
            {
                $push: {
                    itens: {
                        name: iditem,
                        title,
                        value,
                        des: description,
                        stock: estoque
                    }
                }
            })

        let emd = createEmbed({
            description: `**${constants.emojis.ok} \`${iditem}\` adicionado na loja \`${idloja}\`!**`,
            color: constants.colors.green,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })

    }
})