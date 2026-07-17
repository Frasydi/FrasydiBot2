export default function getMentions(pesan:string) {
    const mentions = pesan.match(/(?<=@)[0-9]+/gi)
    return mentions?.map(el => {
        if (el.length === 15 && el.startsWith("9")) {
            return el + "@lid";
        }
        return el + "@s.whatsapp.net";
    })
}