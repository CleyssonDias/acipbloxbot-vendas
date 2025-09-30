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
            name: "emoji",
            description: "🏪 emoji do item",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "value",
            description: "🏪 Valor do item (aceita vírgula ou ponto, ex: 1,00 ou 1.00)",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "stock",
            description: "🏪 Estoque inicial do item",
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 0,
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
    const valueRaw = options.getString("value");
    const estoque = options.getNumber("stock");
    // permitir vírgula como separador e formatos com símbolo ou milhares
    let value: number | undefined = undefined;
    if (typeof valueRaw === 'string') {
        // limpar: remover R$, espaços, e pontos de milhares, manter vírgula e ponto para decimal
        const cleaned = valueRaw.replace(/\s/g, '').replace(/R\$/gi, '').replace(/\./g, '').replace(/,/g, '.');
        const parsed = Number(cleaned);
        if (!isNaN(parsed)) {
            value = Math.round(parsed * 100) / 100;
        }
    }
        const emoji = options.getString("emoji");
        // validar campos obrigatórios (valor pode ser 0.01+)
        if (!idloja || !iditem || !title || !description || value === undefined || estoque === undefined || !emoji) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} Parâmetros inválidos. Verifique os campos e tente novamente.**`,
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

        // validar valor mínimo (R$0,01)
        if (typeof value !== 'number' || value < 0.01) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} O valor mínimo permitido é R$0,01. Informe um valor válido.**`,
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
                        stock: estoque,
                        emoji
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