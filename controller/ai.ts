import { WASocket } from '@adiwajshing/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /ai/i
export const nama = "AI"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"ai [pertanyaan]"
]
export const isGroup = false
export const isAdmin = false
let isLimit = false
const limiter = () => {
    setTimeout(() => {
        isLimit = false
    }, 60000)
}

export default async function AI(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance
}: messageType) {
    if(isLimit) return await socket.sendMessage(room, {
        text :"Hanya bisa digunakan per 1 menit, tunggu sebentar"
    }, {
        quoted : messageInstance
    })
    try {
        isLimit = true
        const res = await axios.post("https://chatgpt-api.shn.hk/v1/", {
            model : "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": pesan.join(" ")}]
    })
        limiter()

        if(res.status > 200) return
        console.log(res.data) 
        const hasil = res.data.choices[0].message
        console.log(hasil)
        await socket.sendMessage(room, {
            text : `*Pertanyaan : ${pesan.join(" ")}*\nJawaban : ${hasil.content}`,
            
        }, {
            quoted : messageInstance
        })
    }catch(err:any) {
        isLimit = false

        if(err.response.data == "Too many requests") {
            return await socket.sendMessage(room, {
                text : "Terlalu banyak request, tunggu satu jam lagi"
            })
        }
        await socket.sendMessage(room, {
            text : "Tampaknya Chat GPT sedang penuh, coba lagi lain kali"
        }, {
            quoted : messageInstance
        })
    }
}         
