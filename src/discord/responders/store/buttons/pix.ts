import { createResponder, ResponderType } from "#base";
import { createEmbed, createRow, sleep } from "@magicyan/discord";
import axios from "axios";
import { AttachmentBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createOrder } from "../../../../database/orders.js";
const MP_TOKEN = process.env.TOKEN_MERCADO_PAGO;
const mpClient = new MercadoPagoConfig({ accessToken: MP_TOKEN!, options: { timeout: 5000 } });
const payment = new Payment(mpClient);

async function gerarPix(valor: number) {
    const valorNum = Number(valor);
    if (!valorNum || isNaN(valorNum) || valorNum <= 0) throw new Error("Valor inválido para cobrança Pix");
    const body = {
        transaction_amount: valorNum,
        description: "Pagamento Pix Discord",
        payment_method_id: "pix",
        payer: { email: `comprador_${Date.now()}_${Math.floor(Math.random() * 10000)}@email.com` }
    };
    let data;
    try {
        const result = await payment.create({ body });
        data = result;
    } catch (err) {
        throw new Error("Erro ao criar cobrança Pix");
    }
    const qrData = data.point_of_interaction?.transaction_data;
    if (!qrData || !qrData.qr_code || !qrData.qr_code_base64) {
        throw new Error("Resposta inesperada do Mercado Pago");
    }
    return {
        qr: qrData.qr_code,
        qr_img: qrData.qr_code_base64,
        copiaecola: qrData.qr_code,
        id: data.id,
        ticket_url: qrData.ticket_url || null
    };
}

createResponder({
    customId: "/store/pix/:canal/:value/:title",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction, params) {
        const title = params.title;
        if (!title) return;
        const value = Number(params.value);
        if (!value || isNaN(value)) return;
        let emd = createEmbed({
            description: "Gerando cobrança Pix...",
            color: constants.colors.azoxo,
        });

        await interaction.reply({ embeds: [emd], components: [] });

        try {
            const pix = await gerarPix(value);
            let attachment: AttachmentBuilder | undefined = undefined;
            if (pix.qr_img) {
                const buffer = Buffer.from(pix.qr_img, "base64");
                attachment = new AttachmentBuilder(buffer, { name: "qr.png" });
            }
            let embed = createEmbed({
                description: `# ${constants.emojis.pix} Pagamento via Pix\n## Escaneie o QR Code abaixo ou use o código copia e cola para pagar.`,
                fields: [
                    { name: "Valor", value: `R$ ${value.toFixed(2)}` },
                    { name: "Copia e Cola", value: `\`\`\`${pix.copiaecola}\`\`\`` || "-" },
                ],
                image: attachment ? { url: `attachment://qr.png` } : undefined,
                color: constants.colors.azoxo,
                timestamp: new Date(),
                footer: {
                    text: `Gerenciamento Lojas`,
                    iconURL: interaction.client.user.displayAvatarURL()
                }
            });
            const row = createRow(
                new ButtonBuilder({
                    customId: `/store/pix/verify/${pix.id}/${title}`,
                    label: "Verificar Pagamento",
                    style: ButtonStyle.Primary,
                    emoji: (() => {
                        const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.pix);
                        if (match) {
                            return { id: match[2], name: match[1] };
                        }
                        return undefined;
                    })()
                }),
                new ButtonBuilder({
                    customId: `/store/pix/copy/${pix.id}`,
                    label: "Pix Copia e Cola",
                    style: ButtonStyle.Secondary,
                    emoji: (() => {
                        const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.paper);
                        if (match) {
                            return { id: match[2], name: match[1] };
                        }
                        return undefined;
                    })()
                })
            );
            await interaction.editReply({
                embeds: [embed],
                components: [row],
                files: attachment ? [attachment] : []
            });
        } catch (e) {
            console.error("Erro ao gerar cobrança Pix:", e);
            await interaction.editReply({ content: "Erro ao gerar cobrança Pix.", embeds: [], components: [] });
        }
    },
});

createResponder({
    customId: "/store/pix/verify/:id/:title",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction, params) {
        await interaction.deferReply();
        const id = params.id;
        const title = params.title;
        if (!id || !title) return;
        try {
            const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { Authorization: `Bearer ${MP_TOKEN}` }
            });
            const data = resp.data;
            const rawStatus = (data.status ?? "unknown").toString().toLowerCase();
            const rawDetail = (data.status_detail ?? "-").toString().toLowerCase();
            const amount = Number(data.transaction_amount ?? 0);

            const statusLabels: Record<string, string> = {
                approved: "Aprovado",
                pending: "Pendente",
                in_process: "Em processamento",
                cancelled: "Cancelado",
                refunded: "Estornado",
                unknown: "Desconhecido"
            };
            const detailLabels: Record<string, string> = {
                accredited: "Pagamento creditado",
                pending_contingency: "Pendente (contingência)",
                pending_review_manual: "Pendente (revisão manual)",
                cc_rejected_bad_filled_data: "Rejeitado (dados incorretos)",
                cc_rejected_other_reason: "Rejeitado (motivo não especificado)",
                refunded: "Estornado",
                cancelled: "Cancelado",
            };

            const status_label = statusLabels[rawStatus] ?? rawStatus.replace(/_/g, ' ');
            const detail_label = detailLabels[rawDetail] ?? (data.status_detail ?? '-');

            const embed = createEmbed({
                title: ``,
                description: `# ${constants.emojis.pix} Verificação de Pagamento PIX
## Resultado da verificação da cobrança: **\`${id}\`**.`,
                color: rawStatus === 'approved' ? (constants.colors as any).success ?? constants.colors.azoxo : constants.colors.azoxo,
                fields: [
                    { name: 'Status', value: `**${status_label}**`, inline: true },
                    { name: 'Detalhe', value: `${detail_label}`, inline: true },
                    { name: 'Valor', value: `R$ ${amount.toFixed(2)}`, inline: true },
                    { name: 'Cobrança ID', value: `${id}`, inline: false }
                ],
                timestamp: new Date(),
                footer: { text: `Verificação solicitada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }
            });

            const components = [] as any[];

            if (rawStatus === 'approved') {
                // cria canal no serverOne (canal do cliente)
                const entregaChannel = await interaction.guild.channels.create({
                    name: `📦-pedido-${id}`,
                    type: 0,
                    parent: constants.categorys.serverOne.entregaCategory,
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
                });
                if (!entregaChannel) return;

                // cria canal no serverTwo (servidor de entrega) usando o ID em constants
                const serverTwoId = constants.categorys.serverTwo.id;
                const serverTwoGuild = interaction.client.guilds.cache.get(serverTwoId);
                let entregaChannelServer: any = null;
                if (serverTwoGuild) {
                    entregaChannelServer = await serverTwoGuild.channels.create({
                        name: `📦-pedido-${id}`,
                        type: 0,
                        parent: constants.categorys.serverTwo.entregaCategory,
                        permissionOverwrites: [
                            {
                                id: serverTwoGuild.roles.everyone,
                                deny: ['ViewChannel']
                            }
                        ]
                    });
                }

                // persistir pedido no MongoDB
                try {
                    await createOrder({
                        orderId: id,
                        clientGuildId: interaction.guild?.id ?? null,
                        clientChannelId: entregaChannel.id,
                        clientUserId: interaction.user?.id ?? null,
                        deliveryGuildId: serverTwoGuild?.id ?? null,
                        deliveryChannelId: entregaChannelServer ? entregaChannelServer.id : entregaChannel.id,
                        status: 'created'
                    });
                } catch (e) {
                    console.error('[pix] erro ao salvar pedido no DB', e);
                }

                const serverTwoChannelIdForButtons = entregaChannelServer ? entregaChannelServer.id : entregaChannel.id;
                const row = createRow(
                    new ButtonBuilder({
                        customId: `/store/finalizarEntrega/${serverTwoChannelIdForButtons}`,
                        label: "Finalizar Entrega",
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
                        customId: `/store/pegarpedido/${serverTwoChannelIdForButtons}/${id}`,
                        label: "Pegar Pedido",
                        style: ButtonStyle.Primary,
                        emoji: (() => {
                            const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.ok);
                            if (match) {
                                return { id: match[2], name: match[1] };
                            }
                            return undefined;
                        })()
                    }),
                    new ButtonBuilder({
                        customId: `/store/marcarAusente/${serverTwoChannelIdForButtons}`,
                        label: "Marcar como Ausente",
                        style: ButtonStyle.Secondary,
                        emoji: (() => {
                            const match = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/.exec(constants.emojis.cancel);
                            if (match) {
                                return { id: match[2], name: match[1] };
                            }
                            return undefined;
                        })()
                    })
                );

                let entrega = createEmbed({
                    description: `# ${constants.emojis.cart} Entrega de Pedido: **\`${id}\`**.`,
                    color: constants.colors.azoxo,
                    fields: [
                        { name: `${constants.emojis.paper} Protudo`, value: `**${title}**`, inline: true },
                        { name: `${constants.emojis.paper} Valor:`, value: `R$ ${amount.toFixed(2)}`, inline: true },
                        { name: `${constants.emojis.paper} Cobrança ID:`, value: `${id}`, inline: false },
                        { name: `${constants.emojis.info} Oque FAZER?:`, value: `Um de nossos entregadores vão pegar seu pedido e realizar sua entrega!`, inline: false }
                    ],
                    timestamp: new Date(),
                    footer: { text: `Genciamento de Lojas`, iconURL: interaction.client.user.displayAvatarURL() }
                });

                // envia para o canal do cliente (no mesmo guild do pedido)
                await entregaChannel.send({ content: `<@${interaction.user.id}>`, embeds: [entrega] });

                // envia para o canal no servidor de entregas (serverTwo) se criado
                if (entregaChannelServer && serverTwoGuild) {
                    const serverTwoChannel = serverTwoGuild.channels.cache.get(entregaChannelServer.id);
                    if (serverTwoChannel && (serverTwoChannel.type === 0 || serverTwoChannel.type === 11)) {
                        // TextChannel (0) ou Thread (11)
                        // @ts-ignore enviar para o canal de texto
                        await serverTwoChannel.send({ content: `<@${interaction.user.id}>`, embeds: [entrega], components: [row] });
                    }
                }

                const actionRow = createRow(
                    new ButtonBuilder({ customId: `/store/pix/confirm/${id}`, label: 'Confirmar pagamento', style: ButtonStyle.Success, disabled: true })
                );
                components.push(actionRow);
                embed.fields!.push({ name: 'Próximo passo', value: `Pagamento aprovado — Chat de entrega criado: <#${entregaChannel.id}>.`, inline: true });
                embed.fields!.push({ name: 'Aviso', value: `O chat de carrinho será deletado em instantes.`, inline: true });
                embed.fields!.push({ name: 'Agradecimentos', value: `A AcipBlox agradece a confiança!`, inline: false });
            }

            await interaction.editReply({ embeds: [embed], components });

            if (rawStatus === 'approved') {
                sleep.seconds(5).then(async ()=>{
                await interaction.channel?.delete();
            })
            }
                                
            return;
        } catch (err) {
            const errEmbed = createEmbed({
                description: "Ocorreu um erro ao consultar a cobrança. Tente novamente mais tarde.",
                color: constants.colors.danger,
                timestamp: new Date(),
                footer: { text: `Gerenciamento Lojas`, iconURL: interaction.client.user.displayAvatarURL() }
            });
            await interaction.editReply({ embeds: [errEmbed] });
            return;
        }
    }
});


createResponder({
    customId: "/store/pix/copy/:id",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction, params) {
        await interaction.deferReply();
        const id = params.id;
        if (!id) {
            await interaction.editReply({ content: "ID da cobrança ausente." });
            return;
        }
        try {
            const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { Authorization: `Bearer ${MP_TOKEN}` }
            });
            const data = resp.data;
            const qr = data?.point_of_interaction?.transaction_data?.qr_code ?? null;
            if (!qr) {
                const errEmbed = createEmbed({
                    description: "Não foi possível recuperar o código copia-e-cola dessa cobrança.",
                    color: constants.colors.danger,
                    timestamp: new Date(),
                    footer: { text: `Gerenciamento Lojas`, iconURL: interaction.client.user.displayAvatarURL() }
                });
                await interaction.editReply({ embeds: [errEmbed] });
                return;
            }

            const embed = createEmbed({
                description: `# ${constants.emojis.pix} Código Pix (Copia e Cola)`,
                color: constants.colors.azoxo,
                fields: [
                    { name: "Cobrança ID", value: `${id}`, inline: true },
                    { name: "Instruções", value: "Copie o código abaixo e cole no seu aplicativo bancário para concluir o pagamento.", inline: false },
                    { name: "Copia e Cola", value: `\`\`\`${qr}\`\`\``, inline: false }
                ],
                timestamp: new Date(),
                footer: { text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }
            });

            await interaction.editReply({ embeds: [embed] });
            return;
        } catch (err) {
            console.error("[PIX][COPY] Erro ao obter copia e cola:", err);
            await interaction.editReply({ content: "Erro ao obter codigo. Tente novamente mais tarde." });
            return;
        }
    }
});