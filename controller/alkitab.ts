import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import axios from 'axios';
export const types = /alkitab/i
export const nama = "Alkitab"
export const kategori = "Education"
export const bantuan = [
    getOptions()?.prefix+"alkitab",
    getOptions()?.prefix+"alkitab [kitab] [bab]",
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
    messageInstance
}: messageType) {
    if(pesan.length == 0) {
        const feting = await axios.get("https://beeble.vercel.app/api/v1/passage/list")
        if(feting.status >= 400) throw "Ada Masalah"
        const hasil = feting.data.data.map((el : any) => `${el.no}. ${el.name}(${el.abbr})`).join("\n")
        return await socket.sendMessage(room, {
            text : `List kitab dari Al-Kitab : \n\n`+hasil,
            mentions : [pengirim],
            
        },
        {
            quoted : messageInstance
        })
    }
    if(pesan.length < 2) throw "Harus terdapat kitab dan nomor bab"
    if(!/[0-9]+/i.test(pesan[1])) throw "Nomor Bab Harus berupa Angka"
    const feting = await axios.get("https://beeble.vercel.app/api/v1/passage/"+pesan[0]+"/"+pesan[1])
    if(feting.status >= 400) throw "Ada Masalah"
    const hasil = feting.data.data.verses.map((el : any) => `${el.verse}. ${el.content}`).join("\n")
    return await socket.sendMessage(room, {
        text : `Isi dari ${feting.data.data.book.name} Bab ${feting.data.data.book.chapter} \n\n`+hasil,
        mentions : [pengirim],
        
    },
    {
        quoted : messageInstance
    })
   
}