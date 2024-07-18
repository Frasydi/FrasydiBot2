export default function getMentions(pesan:string) {
    const mentions = pesan.match(/(?<=@)[0-9]+/gi)
    return mentions?.map(el => el+"@s.whatsapp.net")
}