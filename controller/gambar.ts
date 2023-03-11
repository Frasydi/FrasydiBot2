import { WASocket } from '@adiwajshing/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /gambar/i
export const nama = "Gambar"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"gambar [prompt]"
]
export const isGroup = false
export const isAdmin = false
let isLimit = false
const limiter = () => {
    isLimit = true
    setTimeout(() => {
        isLimit = false
    }, 60000*10)
}


export default async function Gambar(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance
}: messageType) {
    if(isLimit ) return await socket.sendMessage(room, {text :"Hanya bisa digunakan per 10 menit, silahkan tunggu dulu"}, {quoted : messageInstance})
    try {
        isLimit = true
        const res = await axios.get(`https://api.unsplash.com/search/photos?client_id=${process.env.UNSPLASH}&query=${pesan.join(" ")}`)
        limiter()
        console.log(res.data.results[0].urls.regular)
        await socket.sendMessage(room, {image : {url  :  res.data.results[0].urls.regular}}, {quoted : messageInstance})
        
    }catch(err) {
        console.log(err)
        isLimit = false
        await socket.sendMessage(room, {
            text : "Ada Masalah"
        }, {
            quoted : messageInstance
        })
    }
}