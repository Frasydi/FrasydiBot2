import axios, { AxiosError } from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { WASocket, downloadMediaMessage } from '@whiskeysockets/baileys';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import convertQuoted2MsgInfo from '../util/convertQuoted2MsgInfo';
export const types = /^ai$/i
export const nama = "AI"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix + "ai [pertanyaan]"
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
    messageInstance,
    message_type,
    quoted,
    quoted_type
}: messageType) {
    // if(isLimit) return await socket.sendMessage(room, {
    //     text :"Hanya bisa digunakan per 1 menit, tunggu sebentar"
    // }, {
    //     quoted : messageInstance
    // })
    await socket.sendPresenceUpdate("composing", room)
    if (pesan.length == 0) throw "Anda harus mengirimkan pertanyaannya"
    try {
        const genAI = new GoogleGenerativeAI(process.env.AIKEY as string);
        isLimit = true
        const content : Array<string | Part> = [pesan.join(" ")]
        if (message_type == "imageMessage") {
            const buffer = await downloadMediaMessage(messageInstance, "buffer", {});
            content.push({
                inlineData : {
                    data :  (buffer as Buffer).toString("base64"),
                    mimeType : messageInstance.message?.imageMessage?.mimetype as string
                }
            })
        } else if(quoted != null && ["imageMessage", "stickerMessage"].includes(quoted_type as any)) {
            const buffer = await downloadMediaMessage(convertQuoted2MsgInfo(messageInstance), "buffer", {});
            console.log(buffer)
            content.push({
                inlineData : {
                    data :  (buffer as Buffer).toString("base64"),
                    mimeType : "image/webp"
                }
            })

        } 
        const model = genAI.getGenerativeModel({ model: message_type == 'imageMessage' || (quoted != null && ["imageMessage", "stickerMessage"].includes(quoted_type as any)) ?  "gemini-pro-vision" : "gemini-pro" });
        
        const res = await model.generateContent(content)
        console.log(res)
        const data = await res.response
        limiter()

        await socket.sendMessage(room, {
            text: `*Pertanyaan : ${pesan.join(" ")}*\nJawaban : ${data.text()}`,
            mentions: messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid as string[]
        }, {
            quoted: messageInstance
        })
    } catch (err: any) {
        console.log(err)
        if (err instanceof AxiosError) {
            console.log(err.response?.data)
        }
        if(err instanceof GoogleGenerativeAI) {
            throw "Ada Masalah"
        }
        throw "Ada Masalah"
        isLimit = false

    }
}         
