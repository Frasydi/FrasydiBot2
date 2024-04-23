import { messageType } from '../controller_middleware';
import convertTel from '../util/convertTel';
import { getOptions } from '../util/option';
import getMentions from "../util/getMentions"
import { WASocket } from '@whiskeysockets/baileys';
export const types = /Add/i
export const nama = "Add"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"Add [kontak]"
]
export const isGroup = true
export const isAdmin = true
export default async function kick(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isAdmin,
    kontak
}: messageType) {
    if(!isGroup) return await socket.sendMessage(room, {text : "Harus Group"})
    if(!isAdmin) return await socket.sendMessage(room, {text : "Harus Admin"})
    console.log(kontak)
    const newContact = kontak.map(el => "@"+el)
    console.log(newContact)
    try {
        const promise = newContact.map(async(el) => {
            console.log(el, "El kontak")
            await socket.groupParticipantsUpdate(room, [convertTel(el)], "add")
        })
        await Promise.all(promise)
        await socket.sendMessage(room, {text : "Berhasil Menambahkan "+newContact.join(" "), mentions : getMentions(newContact.join(" "))})
    }catch(err) {
        console.log(err)
        await socket.sendMessage(room, {text : "Gagal Menambahkan "+newContact.join(" "), mentions : getMentions(newContact.join(" "))})

    }
}