import { WASocket, downloadMediaMessage, proto } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import convertQuoted2MsgInfo from '../util/convertQuoted2MsgInfo';
export const types = /show/i
export const nama = "Show"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "show"
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
    quoted,
    quoted_type,
    messageInstance,
    isOwner,
    isSpecial
}: messageType) {
    if(!isOwner ) {
        if(!isSpecial) throw "Hanya Orang yang memiliki akses spesial"
    }
    try {

        if (quoted_type == null) throw "Harus mengquoted Pesan"
        const messis = messageInstance.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2|| messageInstance.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.ephemeralMessage?.message?.viewOnceMessageV2  || messageInstance.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2 
        if (messis == null) throw "Harus Pesan Yang hanya bisa dilihat sekali"
        if (quoted_type == "imageMessage") {
            const messageTemp: proto.IWebMessageInfo = convertQuoted2MsgInfo(messageInstance)
            const buffer = await downloadMediaMessage(messageTemp, "buffer", {});
            await socket.sendMessage(room, {
                image: buffer as Buffer,
                caption: `${quoted?.imageMessage?.caption || ""}`,
                mentions: [pengirim],

            }, {
                quoted: messageInstance
            })
        }
        else if (quoted_type == "videoMessage") {
            const messageTemp: proto.IWebMessageInfo = convertQuoted2MsgInfo(messageInstance)
            const buffer = await downloadMediaMessage(messageTemp, "buffer", {});
            await socket.sendMessage(room, {
                video: buffer as Buffer,
                caption: quoted?.imageMessage?.caption || "",
                mentions: [pengirim],

            }, {
                quoted: messageInstance
            })
        }

    } catch (err) {
        console.log(typeof err)
        if (typeof err == "string") {
            throw err
        }

    }
}