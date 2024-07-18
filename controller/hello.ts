import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /hello/i
export const nama = "Hello"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"hello"
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
    await socket.sendMessage(room, {
        text : `Halo @${pengirim.split("@").at(0)}`,
        mentions : [pengirim]
    })
}