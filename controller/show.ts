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
    messageInstance
}: messageType) {
    try {

        if (quoted_type == null) throw "Harus mengquoted Pesan"
        if (messageInstance.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2 == null) throw "Harus Pesan Yang hanay bisa dilihat sekali"
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
        console.log(err)
        if (err instanceof Error) {
            throw err
        }

    }
}