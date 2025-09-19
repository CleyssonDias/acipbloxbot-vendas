import { createResponder, ResponderType } from "#base";
import { createEmbed, sleep } from "@magicyan/discord";

createResponder({
    customId: "/store/finalizar/:canal",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction, params) {
        interaction.deferUpdate()
        const channel = interaction.guild.channels.cache.get(params.canal)
        if (!channel) return;

        let emd = createEmbed({
            description: `**${constants.emojis.ok} A compra foi cancelada com sucesso!**`,
            color: constants.colors.azoxo,
            timestamp: new Date(),
            footer: {
                text: `Gerenciamento Lojas`,
                iconURL: interaction.client.user.displayAvatarURL()
            }
        })

        if (channel.isTextBased && channel.isTextBased()) {
            await channel.send({ embeds: [emd] });
        }

        sleep.seconds(5).then(async()=>{
             await channel.delete().catch(() => { });
        })
       
        
    },
});