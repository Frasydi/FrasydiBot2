import { proto } from '@whiskeysockets/baileys/WAProto';
export default function convertQuoted2MsgInfo(messageInstance : proto.IWebMessageInfo):proto.IWebMessageInfo {
    return {message : messageInstance.message?.extendedTextMessage?.contextInfo?.quotedMessage, key : {remoteJid : messageInstance.message?.extendedTextMessage?.contextInfo?.participant, id : messageInstance.message?.extendedTextMessage?.contextInfo?.stanzaId}}
}