import { proto, WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import axios from 'axios';
import getMentions from '../util/getMentions';
import * as fs from "fs"
import convertGifToMp4 from '../util/convertGifMP4';
export const types = /^slap$/i
export const nama = "Slap"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "slap [tag orangnya]"
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
    mentions
}: messageType) {
    if (mentions.length == 0) {
        throw "Harus mention"
    }
    if (mentions.length > 2) throw "Hanya bisa mention dua orang"

    await socket.sendPresenceUpdate("composing", room)
    const feting = await axios.get("https://api.waifu.pics/sfw/slap", {
        validateStatus: status => status < 500
    })
    if (feting.status >= 400) throw "Ada masalah"
    const data = feting.data.url



    if (data.split(".").at(-1) == "gif") {

        try {
            if (!fs.existsSync("media/temp")) {
                fs.mkdirSync("media/temp")
            }

            const fetingVideo = await axios.get(data, {
                validateStatus: (st) => st < 500,
                responseType: 'arraybuffer'
            })

            if (fetingVideo.status >= 400) {
                console.log(fetingVideo.data)
                throw "Ada Masalah"
            }
            const namaText = data.split("/").at(-1)
            fs.writeFileSync("media/temp/waifu-" + pengirim + "" + namaText, fetingVideo.data)
            await convertGifToMp4("media/temp/waifu-" + pengirim + "" + namaText, "media/temp/waifu-" + pengirim + "" + namaText + ".mp4")


            await socket.sendMessage(room, {
                video: fs.readFileSync("media/temp/waifu-" + pengirim + "" + namaText + ".mp4"),
                gifPlayback: true,
                caption: `${pesan.length == 1 ? "@" + pengirim.replace("@s.whatsapp.net", "") : pesan[0]} menampar ${pesan[ pesan.length == 1 ? 0: 1]}`,
                mentions: [...getMentions(pesan.join(" ") + " " + ("@" + pengirim.replace("@s.whatsapp.net", ""))) || ""],
            })

            fs.rmSync("media/temp/waifu-" + pengirim + "" + namaText + ".mp4")
            fs.rmSync("media/temp/waifu-" + pengirim + "" + namaText)
        } catch (err) {
            console.log(err)
            throw "Ada Masalah"
        }


        return
    }
    await socket.sendMessage(room, {
        image: {
            url: data
        },
        caption: `${pesan.length == 1 ? "@" + pengirim.replace("@s.whatsapp.net", "") : pesan[0]} menampar ${pesan[1]}`,
        mentions: [...getMentions(pesan.join(" ") + " " + ("@" + pengirim.replace("@s.whatsapp.net", ""))) || ""]
    })


}