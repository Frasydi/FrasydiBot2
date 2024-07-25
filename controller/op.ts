import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import convertTel from '../util/convertTel';
import { getOptions } from '../util/option';
import getMentions from "../util/getMentions"
export const types = /promote/i
export const nama = "promote"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"promote [kontak]"
]
export const isGroup = true
export const isAdmin = true
export default async function op(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isAdmin,
    isOwner
}: messageType) {

    if(!isGroup) return await socket.sendMessage(room, {text : "Harus Group"})
        if(!isAdmin) {
            if(!isOwner) {
                await socket.sendMessage(room, {text : "Harus Admin"})
            }
            
        }
    if(pesan.join(" ").trim().length == 0)return await socket.sendMessage(room, {text : "Harus Ada Kontak"})
    await socket.groupParticipantsUpdate(room, pesan.map(el => convertTel(el)), "promote")
    await socket.sendMessage(room, {text : "Berhasil promosi "+pesan.join(" "), mentions : getMentions(pesan.join(" "))})
}