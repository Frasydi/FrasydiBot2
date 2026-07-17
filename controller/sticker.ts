import { proto } from '@whiskeysockets/baileys/WAProto';
import childprocess from 'child_process';
import { WASocket, downloadMediaMessage, WAMessage } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { ConvertWebpBuffer } from '../util/convertwebp';
import duplicateName from '../util/duplicate name';
import { getOptions } from '../util/option';
import saveMedia from '../util/saveMedia';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs'
import imageSize from 'image-size';
export const types = /sticker/i
export const nama = "Sticker"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix + "sticker"
]
export const isGroup = false
export const isAdmin = false
export default async function Sticker(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance,
    message_type,
    quoted_type,
    quoted
}: messageType) {
    if (quoted_type != null) {
        if (quoted_type != "imageMessage") {
            return await socket.sendMessage(room, { text: "Bukan Gambar" })
        }
    } else {
        if (message_type != "imageMessage") return await socket.sendMessage(room, { text: "Bukan Gambar" })
    }

    const messageTemp = quoted != null ? { message: quoted, key: messageInstance.key } : messageInstance
    const buffer = await downloadMediaMessage(messageTemp, "buffer", {});
    const nama = uuidv4()
    console.log(buffer)
    const file = nama + "." + (messageTemp.message?.imageMessage?.mimetype?.split("/").at(-1) || "jpg")
    if (!fs.existsSync("media/temp")) {
        fs.mkdirSync("media/temp")
    }
    try {
        fs.writeFileSync("media/temp/" + file, buffer as Buffer)
        childprocess.execSync(`cwebp -q 90 ${"media/temp/" + file} -o ${"media/temp/" + nama + ".webp"}`)
    } catch (err) {
        console.log(err)
        return await socket.sendMessage(room, { text: "Ada masalah" })
    }

    try {
        const fileSize = imageSize("media/temp/" + nama + ".webp")
        console.log(fileSize)
        const stickerBuffer = fs.readFileSync("media/temp/" + nama + ".webp")
        const result = await socket.sendMessage(room, { sticker: stickerBuffer, fileName: "Sticker Frasydi Bot", height: fileSize.height, width: fileSize.width })
        console.log(result)
    } catch (err) {
        console.log(err)
        return await socket.sendMessage(room, { text: "Ada masalah" })
    }

    try {
        fs.unlinkSync("media/temp/" + file)
        fs.unlinkSync("media/temp/" + nama + ".webp")
    } catch (err) {
        console.log(err)
        return await socket.sendMessage(room, { text: "Ada masalah" })
    }
}