import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /list/i
export const nama = "List"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"list"
]
export const isGroup = false
export const isAdmin = false
export default async function List(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    anggota,
    isAdmin
}: messageType) {
    if(!isGroup) return await socket.sendMessage(room, {text : "Fitur ini hanya boleh digunakan di grub"})
    if(!isAdmin) return await socket.sendMessage(room, {text : "Fitur ini hanya boleh digunakan oleh admin"})
    const mentions : string[] = []
    console.log(anggota)
    const text = anggota.map((el,ind) => {
        mentions.push(el.id)
        return `${ind+1}. @${el.id.split("@").at(0)} ${el.admin == "admin" ? "Admin" : "Anggota"}`
    }).join("\n")

    await socket.sendMessage(room, {
        text : `
        *List Anggota Group*\n${text}
        `,
        mentions : mentions
    })


}