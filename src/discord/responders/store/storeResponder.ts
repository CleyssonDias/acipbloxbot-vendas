import { createResponder, ResponderType } from "#base";
import { db } from "#database";
import { createEmbed, createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle } from "discord.js";

createResponder({
    customId: "/store/:idloja",
    types: [ResponderType.StringSelect], cache: "cached",
    async run(interaction, param) {
        const res = await interaction.deferReply({ flags: ['Ephemeral'] })
        const selected = await interaction.values[0];

        const loja = await db.store.findOne({
            nameid: param.idloja
        })

        if (!loja) return;

        const item = loja.itens.find(x => x.name == selected)
        if (!item) {
            let emd = createEmbed({
                description: `**${constants.emojis.cancel} O item não existe na loja \`${loja.title}\`!**`,
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

        const category = interaction.guild.channels.cache.get(constants.categorys.serverOne.cartCategory)
        if (!category) return;

        const canal = await interaction.guild.channels.create({
            name: `🛒-${interaction.user.username}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks']
                },
                {
                    id: interaction.client.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks']
                }
            ]
        })

        let row = createRow(
                        new ButtonBuilder({
                customId: `/store/finalizar/${canal.id}`,
                label: "Cancelar",
                style: ButtonStyle.Danger,
                emoji: (() => {
                    const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.cancel);
                    if (match) {
                        return { id: match[2], name: match[1] };
                    }
                    return undefined;
                })()
            }),
            new ButtonBuilder({
                customId: `/store/cupom/${canal.id}`,
                label: "Adiconar Cupom",
                style: ButtonStyle.Secondary,
                emoji: (() => {
                    const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.paper);
                    if (match) {
                        return { id: match[2], name: match[1] };
                    }
                    return undefined;
                })()    

            }),
            new ButtonBuilder({
                customId: `/store/pix/${canal.id}/${item.value}/${item.title}`,
                label: "Realizar Pix",
                style: ButtonStyle.Success,
                emoji: (() => {
                    const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.pix);
                    if (match) {
                        return { id: match[2], name: match[1] };
                    }
                    return undefined;
                })()
            }),
        )

        let storeEmd = createEmbed({
            fields: [
                {
                    name: `${constants.emojis.info} Item Adicionado:`,
                    value: `**Nome: ${item.title}**\n**Valor:** R$${item.value}\n**Descrição:** ${item.des}\n`,
                    inline: true
                },
                {
                    name: `${constants.emojis.info} Valores:`,
                    value: `**Valor final:** R$${item.value}`,
                    inline: true
                },
            ],
            description:`# ${constants.emojis.cart} Carrinho de ${interaction.user}
> Olá **${interaction.user}**, este é o seu **carrinho de compras**! Aqui está o item que você selecionou:`,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })


        canal.send({embeds: [storeEmd], components: [row]})


        let emd = createEmbed({
            description: `**${constants.emojis.ok} Carrinho criado com sucesso! confira:${canal}!**`,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })
        res.edit({ embeds: [emd] })
    },
});