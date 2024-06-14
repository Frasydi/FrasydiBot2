import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import gplay from "google-play-scraper";
export const types = /goplay/i
export const nama = "Goplay"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"goplay",
    getOptions()?.prefix+"goplay search [param]",
    getOptions()?.prefix+"goplay detail [id]",
    getOptions()?.prefix+"goplay reviews [id]"
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
    if(pesan.length < 2) throw `Anda harus memasukkan parameter tambahan`
    await socket.sendPresenceUpdate('composing', room)
    if(pesan[0] == "search") {
        const getApp = gplay.search({
            term : pesan.slice(1).join(" "),
            country :"id",
            lang : "id",
        })
        console.log(getApp)
        return  await socket.sendMessage(room, {
            text : `Halo @${pengirim.split("@").at(0)}`,
            mentions : [pengirim]
        })
    }

    await socket.sendMessage(room, {
        text : `Halo @${pengirim.split("@").at(0)}`,
        mentions : [pengirim]
    })
}