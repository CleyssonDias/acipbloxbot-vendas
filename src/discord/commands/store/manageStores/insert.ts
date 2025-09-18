import { db } from "#database";
import { createEmbed, createRow } from "@magicyan/discord";
import { ApplicationCommandOptionType, StringSelectMenuBuilder } from "discord.js";
import commad from "../commad.js";

commad.subcommand({
    name: "colocar",
    description: "🏪 Colocar Loja",
    options: [{
        name: "idloja",
        description: "🏪 Nome unico da loja",
        type: ApplicationCommandOptionType.String,
    }, {
        name: "canal",
        description: "🏪 Canal onde a loja sera colocada",
        type: ApplicationCommandOptionType.Channel,
    }],
    async run(interaction) {
        const { options } = interaction;
        const res = await interaction.deferReply({ flags: ['Ephemeral'] })

        const idloja = options.getString("idloja");
        const canal = options.getChannel("canal");

        if (!idloja || !canal) return;

        const isStore = await db.store.find({
            nameid: idloja
        })
        if (isStore.length == 0) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} A Loja \`${idloja}\` não econtrada!**`,
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


        if (isStore[0].itens.length == 0) {
            let emd = createEmbed({
                title: `${constants.emojis.folder} Itens da Loja \`${idloja}\`:`,
                description: `**${constants.emojis.sad} A Loja \`${idloja}\` não possui itens!**`,
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


        const itens: any = []

        isStore[0].itens.map(x => {
            itens.push({
                emoji: `${constants.emojis.paper}`,
                label: `${x.name} | ${x.value}`,
                value: `${x.des} | ${x.stock}`,
            })
        })

        const row = createRow(
            new StringSelectMenuBuilder({
                customId: "/select/fruits",
                placeholder: "Select fruits",
                options: itens
            })
        );

        let emd = createEmbed({
            title: `${constants.emojis.folder} Loja \`${idloja}\`:`,
            description: `**${constants.emojis.ok} A Loja \`${idloja}\` foi colocada no canal ${canal} com sucesso!**`,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })


        emd = createEmbed({
            title: `🏪 Loja \`${isStore[0].nameid}\`:`,
            description: `${isStore[0].des}`,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Loja`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })  

        const sendcanal = interaction.guild.channels.cache.get(canal.id);
        if (sendcanal && sendcanal.isTextBased && sendcanal.isTextBased()) {
            sendcanal.send({ embeds: [emd], components: [row] });
        } else {
            let emdError = createEmbed({
                description: `**${constants.emojis.cancel} O canal selecionado não é um canal de texto!**`,
                color: constants.colors.danger,
                timestamp: new Date(),
                footer: {
                    text: `Gerenciamento Lojas`,
                    iconURL: interaction.client.user.displayAvatarURL()
                }
            });
            res.edit({ embeds: [emdError] });
        }
       


    }
})