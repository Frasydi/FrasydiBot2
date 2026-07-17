import { WASocket, downloadMediaMessage, proto, WAMessage } from '@whiskeysockets/baileys';
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
    if (!isOwner) {
        if (!isSpecial) throw "Hanya Orang yang memiliki akses spesial"
    }
    try {

        if (quoted_type == null) throw "Harus mengquoted Pesan"

        const quotedMsg = (messageInstance.message?.extendedTextMessage?.contextInfo?.quotedMessage
            || messageInstance.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage) as any;
        const quotedAny = quoted as any;

        const isViewOnce = !!(
            quotedMsg?.viewOnceMessageV2 ||
            quotedMsg?.viewOnceMessage ||
            quotedMsg?.viewOnceMessageV2Extension ||
            quotedMsg?.ephemeralMessage?.message?.viewOnceMessageV2 ||
            quotedMsg?.ephemeralMessage?.message?.viewOnceMessage ||
            quotedMsg?.imageMessage?.viewOnce ||
            quotedMsg?.videoMessage?.viewOnce ||
            quotedMsg?.ephemeralMessage?.message?.imageMessage?.viewOnce ||
            quotedMsg?.ephemeralMessage?.message?.videoMessage?.viewOnce ||
            quotedAny?.viewOnce ||
            quotedAny?.imageMessage?.viewOnce ||
            quotedAny?.videoMessage?.viewOnce ||
            quotedAny?.viewOnceMessageV2 ||
            quotedAny?.viewOnceMessage ||
            quotedAny?.viewOnceMessageV3 ||
            quotedAny?.ephemeralMessage?.message?.viewOnceMessageV2 ||
            quotedAny?.ephemeralMessage?.message?.viewOnceMessage ||
            quotedAny?.ephemeralMessage?.message?.imageMessage?.viewOnce ||
            quotedAny?.ephemeralMessage?.message?.videoMessage?.viewOnce
        );

        if (!isViewOnce) throw "Harus Pesan Yang hanya bisa dilihat sekali"

        if (quoted_type == "imageMessage") {
            const messageTemp: WAMessage = convertQuoted2MsgInfo(messageInstance)
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
            const messageTemp: WAMessage = convertQuoted2MsgInfo(messageInstance)
            const buffer = await downloadMediaMessage(messageTemp, "buffer", {});
            await socket.sendMessage(room, {
                video: buffer as Buffer,
                caption: quoted?.videoMessage?.caption || "",
                mentions: [pengirim],

            }, {
                quoted: messageInstance
            })
        }

    } catch (err) {
        console.error("Show error:", err);
        throw err instanceof Error ? err.message : String(err);
    }
}