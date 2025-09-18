import { createCommand } from "#base";
import { ApplicationCommandType } from "discord.js";

export default createCommand({
    name: "loja",
    description: "🏪 Gerenciamento lojas da AcipBlox!",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["Administrator"]
});