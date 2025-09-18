import { db } from "#database";
import { createEmbed } from "@magicyan/discord";
import commad from "../commad.js";

commad.subcommand({
    name: "listar",
    description: "🏪 Listar Lojas criadas!",
    async run(interaction) {
        const res = await interaction.deferReply({
            flags: ['Ephemeral']
        })
        var lojas = ''
        const dados = await db.store.find({})

        dados.map((loja) => {
            var itenscont = 0
            if(!loja.itens) return

            loja.itens.map(() => {
                itenscont++
            })

            lojas = lojas + `**${constants.emojis.store} \`${loja.nameid}\` - \`${itenscont}\` itens**\n`
        })

        if (lojas == ""){
            lojas = `${constants.emojis.sad} Nenhuma loja foi encontrada!`
        }

        let emd = createEmbed({
            title: `${constants.emojis.folder} Lojas`,
            description: lojas,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })
    },
})