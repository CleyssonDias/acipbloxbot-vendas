export function parseEmoji(emojiString: string) {
    const match = emojiString.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);
    if (!match) return { name: emojiString }; // emoji padrão unicode
    return { name: match[1], id: match[2] };
}