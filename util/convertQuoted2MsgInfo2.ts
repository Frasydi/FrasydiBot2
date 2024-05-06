import { proto } from "@whiskeysockets/baileys"
import { messageType } from "../controller_middleware"
import { msg_type } from "./msgType"

export default function convertQuoted2MsgInfo2(messageInstance : proto.IWebMessageInfo, type : msg_type ):proto.IWebMessageInfo {
    
    const mess = messageInstance?.message?.ephemeralMessage?.message?.extendedTextMessage || messageInstance.message?.extendedTextMessage
    return {message : mess?.contextInfo?.quotedMessage, key : {remoteJid : mess?.contextInfo?.participant, id : messageInstance.message?.extendedTextMessage?.contextInfo?.stanzaId}}
}