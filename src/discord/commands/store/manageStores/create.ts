import { db } from "#database";
import { createEmbed } from "@magicyan/discord";
import { ApplicationCommandOptionType } from "discord.js";
import commad from "../commad.js";

commad.subcommand({
    name:"criar",
    description:"🏪 Criar Loja",
    options:[
        {
            name: "id",
            description: "🏪 Nome unico da loja",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "title",
            description: "🏪 Titulo da loja",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "description",
            description: "🏪 Descrição da loja",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    async run(interaction) {
        const test = await interaction.deferReply({ flags:['Ephemeral'] })
        const { options } = interaction;

        const id = options.getString("id");
        const title = options.getString("title");
        const description = options.getString("description");

        if (!id || !title || !description) return;

        const isStore = await db.store.find({
            nameid: id
        })

        if (isStore.length == 0) {
            await db.store.create({
                nameid: id,
                title,
                des: description
            })

            let res = createEmbed({
                description: `**${constants.emojis.ok} Loja \`${id}\` criada com sucesso!**`,
                color: constants.colors.azoxo,
                timestamp: new Date(),
                footer: {
                    text: `Gerenciamento Lojas`,
                    iconURL: interaction.client.user.displayAvatarURL()              
                }
            })
            test.edit({ embeds: [res] })
            return
        }
        let res = createEmbed({
            description:`**${constants.emojis.cancel} A Loja \`${id}\` já existe!**`,
            color: constants.colors.danger,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()              
            }
        })
        test.edit({ embeds: [res]})
    },
})