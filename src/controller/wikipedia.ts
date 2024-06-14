import { WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import {htmlToText} from "html-to-text"
export const types = /wikipedia/i
export const nama = "wikipedia"
export const kategori = "Education"
export const bantuan = [
    getOptions()?.prefix+"wikipedia [pertanyaan]"
]
export const isGroup = false
export const isAdmin = false


interface searchType {
    
        batchcomplete: string,
        continue: {
            sroffset: number,
            continue: string
        },
        query: {
            searchinfo: {
                totalhits: number
            },
            search: 
                {
                    ns: number,
                    title: string,
                    pageid: number,
                    size: number,
                    wordcount: number,
                    snippet: string,
                    timestamp: string
                }[]
        }
    
}
export default async function Wikipedia(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance
}: messageType) {
    await socket.sendPresenceUpdate("composing", room)
    if(pesan.join(" ").trim().length == 0) return await socket.sendMessage(room, {text : "Anda tidak memasukkan pencarian"})
        console.log(pesan)
    const hasil = await axios.get(`https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(pesan.join(" "))}&format=json&uselang=id`)
    
    const data:searchType = hasil.data
    if(data.query.searchinfo.totalhits == 0) return await socket.sendMessage(room, {text : "Tidak menemukan artikel yang anda cari"})
    const firstSearch = data.query.search[0]
    const hasil2 = await axios.get(`https://id.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|info&pithumbsize=500&exintro&explaintext&pageids=${firstSearch.pageid}&uselang=id`)
    const title = htmlToText(hasil2.data.query?.pages?.[firstSearch.pageid].title)
    const hasilText = htmlToText(hasil2.data.query?.pages?.[firstSearch.pageid].extract)
    const gambar = hasil2.data.query?.pages?.[firstSearch.pageid]?.thumbnail?.source
    return await socket.sendMessage(room, {image : {url : gambar},caption : `*${title}*\n\n\t${hasilText}`}, {quoted : messageInstance})
}