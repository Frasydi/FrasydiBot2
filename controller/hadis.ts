import { WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /hadis/i
export const nama = "hadis"
export const kategori = "Education"
export const bantuan = [
    getOptions()?.prefix+"hadis",
    getOptions()?.prefix+"hadis [nama buku]",
    getOptions()?.prefix+"hadis [nama buku] [nomor]",
]
export const isGroup = false
export const isAdmin = false
export default async function Hadis(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    try {

        if(pesan.length == 0) {
            const fet = await axios.get("https://api.hadith.gading.dev/books")
            const data = fet.data
            const books = data.data.map((el:any, ind:number) => `${ind+1}. ${el.name}(${el.id}) : ${el.available}`).join("\n")

            return socket.sendMessage(room, {text : "Daftar Buku Hadis\n"+books})
        }
        if(pesan.length < 2) throw "Harus mengisikan nama buku dan hadis"
        const fet = await axios.get(`https://api.hadith.gading.dev/books/${pesan[0]}/${pesan[1]}`)
        const data = fet.data
        if(data.data.contents == null) throw "Tidak menemukan nomor yang dimaksud"
        const hasil = `${data.data.contents.arab}\n${data.data.contents.id}`
        await socket.sendMessage(room, {text : `Hasil dari hadis ${data.data.name}, nomor : ${data.data.contents.number}\n\n`+hasil})
    }catch(err : any) {
        console.log(err)
        if(typeof err == "string") await socket.sendMessage(room, {text : err })
        if(err?.response != null) await socket.sendMessage(room, {text : err.response.data.message })
    }
}