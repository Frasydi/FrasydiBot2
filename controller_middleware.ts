
import ControllerFunctions from "./controller_add";
import { getOptions } from "./util/option";
import { getGroupMetadata } from "./util/group";
import { GroupParticipant, MessageUpsertType, WASocket, proto } from "@whiskeysockets/baileys";
import { msg_type } from "./util/msgType";
import { chatAnonim } from "./util/anonim";

export interface messageType {
    key: string,
    fromMe: boolean,
    pesan: string[],
    room: string,
    pengirim: string,
    isGroup: boolean,
    pengirim_nama: string,
    anggota: Array<GroupParticipant>,
    isAdmin: boolean,
    messageInstance: proto.IWebMessageInfo,
    kontak: string[],
    quoted?: proto.IMessage | null | undefined,
    message_type: msg_type,
    quoted_type?: msg_type,
    mentions: string[],
    isOwner: boolean,
    isSpecial : boolean
}
export default async function MiddlewareController(message: {
    messages: proto.IWebMessageInfo[];
    type: MessageUpsertType;
}, socket: WASocket) {


    const isGroup = message.messages?.[0].key?.participant != null



    const pesan = message.messages[0].message?.conversation ||
        message.messages[0].message?.ephemeralMessage?.message?.extendedTextMessage?.text
        || message.messages[0].message?.listResponseMessage?.singleSelectReply?.selectedRowId
        || message.messages[0].message?.buttonsResponseMessage?.selectedButtonId
        || message.messages[0].message?.extendedTextMessage?.text || message.messages[0].message?.imageMessage?.caption
    const quoted = message.messages[0].message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.ephemeralMessage?.message?.viewOnceMessageV2?.message
        || message.messages[0].message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.ephemeralMessage?.message
        || message.messages[0].message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || message.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2?.message
        || message.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage
        || message.messages[0].message?.imageMessage?.contextInfo?.quotedMessage

    const msgType = Object.keys(message?.messages[0].message as object)[0]
    let mentions = message.messages[0].message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || message.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid || message.messages[0].message?.imageMessage?.contextInfo?.mentionedJid || message.messages[0].message?.videoMessage?.contextInfo?.mentionedJid || []
    if (typeof mentions == "string") {
        mentions = [mentions]
    }
    const sending: messageType = {
        key: message.messages[0].key.id as string,
        fromMe: message.messages[0].key.fromMe as boolean,
        room: message.messages[0].key.remoteJid as string,
        pesan: pesan?.split(/\n/).map(el => "\n"+el).join(" ").split(" ").slice(1)  || [],
        pengirim: isGroup ? message.messages[0].key.participant as string : message.messages[0].key.remoteJid as string,
        isGroup: isGroup,
        anggota: [],
        pengirim_nama: message.messages[0].pushName as string,
        isAdmin: false,
        messageInstance: message.messages[0],
        quoted,
        kontak: [],
        message_type: msgType as unknown as msg_type,
        mentions: mentions,
        isOwner: false,
        isSpecial : false
    }
    console.log(pesan)

    if (getOptions().restrict != null) {
        const rest = getOptions().restrict as {
            [key: string]: string
        }
        if (rest[sending.room] != null) {

            if (rest[sending.room].includes(sending.pengirim)) {
                if ((["imageMessage", "stickerMessage", "videoMessage"] as msg_type[]).includes(sending.message_type)) {
                    await socket.sendMessage(sending.room, { delete: sending.messageInstance.key })

                } else {
                    setTimeout(async () => {
                        try {
                            await socket.sendMessage(sending.room, { delete: sending.messageInstance.key })
                        } catch (err) {

                        }
                    }, 3000)
                }

                return
            }
        }

    }

    if (!(pesan?.at(0) == getOptions().prefix as string)) {
        if (!isGroup) {
            await chatAnonim(message.messages[0].key.remoteJid || "", pesan || "")
        }
        return
    }


    if (getOptions().ban != null) {
        if ((getOptions().ban as string[]).includes(sending.pengirim)) {
            socket.sendMessage(sending.room, {
                text: "Maaf anda sudah diblacklist untuk menggunakan bot ini"
            })
            return
        }
    }

    if (quoted != null) {
        sending.quoted_type = Object.keys((quoted) as object)[0] as msg_type
    }
    if (quoted?.contactMessage?.vcard != null) {
        const contact: string[] = quoted?.contactMessage?.vcard?.match(/(?<=waid=)[0-9]+/gi) as string[]
        console.log(contact)
        sending.kontak?.push(contact?.[0])
    }
    if (quoted?.contactsArrayMessage != null) {
        quoted?.contactsArrayMessage.contacts?.forEach(el => {
            console.log(el.vcard)
            const contact: string[] = el?.vcard?.match(/(?<=waid=)[0-9]+/gi) as string[]
            console.log(contact)
            if (contact == null) return
            sending.kontak?.push(contact?.[0])
        })
    }
    if (isGroup) {
        sending.anggota = await getGroupMetadata(sending.room as string, socket)
        sending.isAdmin = ["admin", "superadmin"].includes(sending.anggota.filter(el => el.id == sending.pengirim)[0].admin || "")
    }
    

    sending.isOwner = getOptions().owner.includes(sending.pengirim)
    const specperm = getOptions().specialpermission
    if(specperm != null) {
        sending.isSpecial = specperm.includes(sending.pengirim)
    }


    for (let el of ControllerFunctions()) {
        console.log(el.types)
        if (!el.types.test(pesan.split(" ")[0].split("/").at(-1) as string)) continue;


        el.default(socket, sending).catch((err: any) => {
            console.log(err)

            socket.sendMessage(sending.room, { text: typeof err == "string" ? err : "Ada Error" })
        })
        break

    }

}