import { db } from "#database";
import { createEmbed, createMediaGallery, createRow } from "@magicyan/discord";
import { ApplicationCommandOptionType, StringSelectMenuBuilder } from "discord.js";
import { constructor } from "functions/constructor.js";
import parseEmoji from "functions/parseEmoji.js";
import commad from "../commad.js";

commad.subcommand({
    name: "colocar",
    description: "🏪 Colocar Loja",
    options: [{
        name: "idloja",
        description: "🏪 Nome unico da loja",
        type: ApplicationCommandOptionType.String,
        required: true
    }, {
        name: "canal",
        description: "🏪 Canal onde a loja sera colocada",
        type: ApplicationCommandOptionType.Channel,
        required: true
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
                emoji: x.emoji ? parseEmoji(x.emoji) : parseEmoji(constants.emojis.paper),
                label: `${x.title} | R$${x.value}`,
                value: `${x.name}`,
                description: `${x.des} | Estoque: ${x.stock === -1 ? '∞' : x.stock}`
            })
        })

        const row = createRow(
            new StringSelectMenuBuilder({
                customId: `/store/${idloja}`,
                placeholder: "SELECIONE SEU ITEM AKI!",
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

        const sendcanal = interaction.guild.channels.cache.get(canal.id);
        if (sendcanal && sendcanal.isTextBased && sendcanal.isTextBased()) {

            await sendcanal.send(constructor.azoxo(
                `# ${constants.emojis.store} Loja \`${isStore[0].title}\``,
                `## ${isStore[0].des}`,
                await createMediaGallery(isStore[0].img),
                `## **${constants.emojis.folder} Selecione algum item da loja \`${isStore[0].title}\` abaixo:**`,
                `-# ${constants.emojis.info} Após selecionado será criado um carrinho!`,
                row,
                `-# ${constants.emojis.ok} Gerenciamento Lojas`
            ));

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