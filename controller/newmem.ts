import { downloadMediaMessage, WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { setNewMem } from '../util/newmemsetting';
import convertQuoted2MsgInfo from '../util/convertQuoted2MsgInfo';
import * as fs from "fs"
import childprocess from 'child_process';


export const types = /newmem/i
export const nama = "New Member"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix + "newmem (dengan keadaan mengquoted pesan yang ingin dijadikan pesan untuk new mem)"
]
export const isGroup = false
export const isAdmin = false
export default async function NewMember(socket: WASocket, {
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
    isAdmin
}: messageType) {
    if(!isAdmin) throw "Harus Admin"
    if (quoted == null) throw "Harus menquoted pesan untuk newmem"
    if (quoted_type == "videoMessage") throw "Harus Quoted pesan teks atau teks gambar saja"
    else if (quoted_type == "imageMessage") {
        const buffer = await downloadMediaMessage(convertQuoted2MsgInfo(messageInstance), "buffer", {});
        console.log(messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1))
        const file = room + "." + messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1)
        if (!fs.existsSync("media/newmem")) {
            fs.mkdirSync("media/newmem")
        }
        if (!fs.existsSync("media/temp")) {
            fs.mkdirSync("media/temp")
        }
        try {
            fs.writeFileSync("media/temp/" + "newmem" + file, buffer as Buffer)
            childprocess.execSync(`cwebp -q 90 ${"media/temp/" + "newmem" + file} -o ${"media/newmem/" + room + ".webp"}`)
        } catch (err) {
            console.log(err)
            return await socket.sendMessage(room, { text: "Ada masalah" })
        }
        setNewMem(room, quoted.imageMessage?.caption || quoted.conversation || "", room + ".webp")

        fs.unlinkSync("media/temp/newmem" + file)

    } else {
        setNewMem(room, quoted.conversation || "", null)

    }
    await socket.sendMessage(room, {
        text: `Berhasil Mengupdate setting pesan untuk new member`,
        mentions: [pengirim]
    })



   

}