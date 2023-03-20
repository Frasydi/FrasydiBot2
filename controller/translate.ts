import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import localeCodes from 'locale-codes';
//@ts-ignore
import translateCode from "translate-google"
export const types = /^tl$/i
export const nama = "tl"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"tl"
]
export const isGroup = false
export const isAdmin = false
export default async function tl(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    if(pesan.length == 0) {
        const languages = localeCodes.all
        const pesan = languages.map((el,ind) => `${ind+1}. ${el.name} : ${el.tag}`).join("\n")
        throw `List Kode Bahasa\n\n${pesan}`
    }
    if(pesan.length < 2) throw `Harus Masukkan kode bahasa dan kata yang ingin diterjemahkan. Contoh tl id--en Tes`
    if(!pesan[0].includes("--")) throw "Anda tidak memasukkan pembatas"
    const [from, to] = pesan[0].split("--")
    const [codeFrom, codeTo] = [localeCodes.where("tag", from), localeCodes.where("tag", to)] 
    console.log(codeFrom)
    if( codeFrom == null) throw "Kode bahasa tidak diketahui"
    if(codeTo == null) throw "Kode bahasa tidak diketahui"
    const fet = await translateCode( pesan.slice(1).join(" "), {from : from, to})
    throw `Terjemahan dari ${codeFrom.name} ke ${codeTo.name}.\n\nKata : ${pesan.slice(1).join(" ")}\nArti : ${fet}`
}