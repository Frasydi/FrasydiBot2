export default function convertTel(text : string) {
    if(/@/i.test(text)) return text.split("@").at(1)?.trim()+"@s.whatsapp.net"
    return text.replace(/0/i, "62")+"@s.whatsapp.net"
}