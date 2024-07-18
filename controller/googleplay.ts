import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { IFnSearchOptions, app } from 'google-play-scraper';
import goplay from "google-play-scraper"
import * as fs from "fs"
export const types = /goplay/i
export const nama = "Goplay"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"goplay",
    getOptions()?.prefix+"goplay search [param]",
    getOptions()?.prefix+"goplay detail [id]",
    getOptions()?.prefix+"goplay reviews [id]"
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
    messageInstance
}: messageType) {
    if(pesan.length < 2) throw `Anda harus memasukkan parameter tambahan`
    await socket.sendPresenceUpdate('composing', room)
    if(pesan[0] == "search") {
        const getApp  = await goplay.search({
            term : pesan.slice(1).join(" "),
            country :"id",
            lang : "id",
        })
        console.log(getApp)
        return  await socket.sendMessage(room, {
            text : `List Search dari PlayStore\n${getApp.map((el, ind) => `${ind+1}. ${el.title}(id: ${el.appId}). ${el.score} [${el.url}]`).join("\n\n")}`,
        }, {
            quoted : messageInstance
        })
    } else if(pesan[0] == "detail") {
        const apps  = await goplay.app({
            appId : pesan.slice(1).join(" "),
            country :"id",
            lang : "id",
        })

        
        return  await socket.sendMessage(room, {
            caption : `Judul : ${apps.title}\nHarga : ${apps.price.toLocaleString("id-ID", {
                style :"currency",
                currency :"IDR",
            })}\nDeveloper : ${apps.developer}\nRating : ${apps.scoreText}\nJumlah Rating : ${apps.ratings}\nKategori : ${apps.categories.map(el => el.name).join(", ")}\nDeskripsi : ${apps.description}`,
            image : {
                url : apps.icon
            }
        }, {
            quoted : messageInstance
        })
    } else if(pesan[0] == "reviews") {


        await socket.sendMessage(room, {
            text : `Data sedang diunduh. Harap Menunggu`,
            mentions : [pengirim]
        })

        const apps  = await goplay.reviews({
            appId : pesan.slice(1).join(" "),
            country :"id",
            lang : "id",
            num : 90000,
        })

        if(fs.existsSync("./temp") == false ) {
            fs.mkdirSync("./temp")
        }


        const names = `${pesan.slice(1).join("_")}-${pengirim_nama}-googleplaytemp.json`
        
        if(fs.existsSync("./temp/"+names)) {
            throw "Upps Sepertinya anda sudah memiliki review yang sedang diunggah"
        }
        
        fs.writeFileSync("./temp/"+names, JSON.stringify(apps, null, 2))

        await socket.sendMessage(room, {
            text : `Pesan Akan Dikirimkan. Harap Menunggu`,
            mentions : [pengirim]
        })

        await socket.sendMessage(room, {
            document : {
                url : "./temp/"+names
            },
            fileName : names,
            mimetype : "application/json",
            
            mentions : [pengirim]
        } ) 

        fs.rmSync("./temp/"+names)
        
        
        return
    }

    await socket.sendMessage(room, {
        text : `Tampaknya ada kesalahan`,
        mentions : [pengirim]
    })
}