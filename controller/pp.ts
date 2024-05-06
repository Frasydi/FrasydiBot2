import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /pp/i
export const nama = "PP"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "pp",
    getOptions()?.prefix + "pp grup",
]
export const isGroup = false
export const isAdmin = false
export default async function Hello(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    if (pesan.length == 1) {
        try {
            const ppUrl = await socket.profilePictureUrl(pesan[0] == "grup" ?  room : pesan[0].trim().split("@").join("") + "@s.whatsapp.net", "image") 
            await socket.sendMessage(room, { image: { url: ppUrl || "" }, caption: "Berhasil mengirimkan pp dari " + pesan[0], mentions: [pesan[0].split("@").join("") + "@s.whatsapp.net"] })

        } catch (err) {
            console.log(err)
            throw "Ada Error"
        }
        return
    }
    throw "Harus mention Orang"
}
