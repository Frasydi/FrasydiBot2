import axios, { AxiosError } from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { WASocket } from '@whiskeysockets/baileys';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
    // if(isLimit) return await socket.sendMessage(room, {
    //     text :"Hanya bisa digunakan per 1 menit, tunggu sebentar"
    // }, {
    //     quoted : messageInstance
    // })
    if(pesan.length == 0) throw "Anda harus mengirimkan pertanyaannya"    
    try {
        const genAI = new GoogleGenerativeAI(process.env.AIKEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        isLimit = true
        const res = await model.generateContent(pesan.join(" "))
        console.log(res)
        const data = await res.response
        limiter()

        await socket.sendMessage(room, {
            text : `*Pertanyaan : ${pesan.join(" ")}*\nJawaban : ${data.text()}`,
            mentions : messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid as string[]
        }, {
            quoted : messageInstance
        })
    }catch(err:any) {
        console.log(err)
        if(err instanceof AxiosError) {
            console.log(err.response?.data)
        }
        isLimit = false

        
    }
}         
