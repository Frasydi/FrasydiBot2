import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { setNewMem } from '../util/newmemsetting';
import { auth, v2 } from 'osu-api-extended';
import { response } from 'osu-api-extended/dist/types/v2_beatmaps_search';
import { response as detailresponse} from 'osu-api-extended/dist/types/v2_beatmap_id_details';
import axios from 'axios';
export const types = /anime/i
export const nama = "Anime"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "anime search [search]",
    getOptions()?.prefix + "anime detail [id]",
]
export const isGroup = false
export const isAdmin = false
export default async function Osu(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    quoted,
    quoted_type
}: messageType) {
    try {
        await socket.sendPresenceUpdate("composing", room)
        if (pesan.length < 2) throw "Parameter tidak lengkap"
        if (["search", "detail"].includes(pesan[0]) == false) throw "Harus mencantumkan tipe (search | detail)"



        if (pesan[0] == "detail") {
            const feting = await axios.get(`https://api.jikan.moe/v4/anime/${pesan[1]}/full`, {
                validateStatus : (status) => {
                    return status < 500
                }
            })
            if(feting.status >= 400) throw "Ada Masalah"
            const data = feting.data.data
            
            let teks = `Title : ${data.title}\nTitle Japanase: ${data.title_japanase}\nJumlah Episode : ${data.episodes}\nRating : ${data.rating}\nScore : ${data.score}\nTahun : ${data.year}\nMusim : ${data.season}\nTrailer : ${data.trailer.id}\n`
            if(data.relations != null) {
                teks += "Relasi : \n"
                data.relations.forEach((el : any, ind : number) => {
                    teks+=`\t*${el.relation}* : \n`
                    console.log(el.entry)
                    el.entry.forEach((el2 : any) => {
                        teks+=`\t\t-${el2.name} [${el2.mal_id}] \n`
                    })
                    teks +"\n"
                })
            }
            if(data.theme  != null) {
                teks += `Opening : \n`
                data.theme.openings.forEach((el : any, ind : number) => {
                    teks+=`\t-${el}\n`
                })
                teks += `Ending : \n`
                data.theme.endings.forEach((el : any, ind : number) => {
                    teks+=`\t-${el}\n`
                })
            }
            console.log(data)

            await socket.sendMessage(room, {
                caption: `Berhasil Mendapatkan detail anime : \n\n${teks}`,
                image : {
                    url : data.images.webp.large_image_url ,
                    
                },
                mentions: [pengirim]
            }, {
                
            })
        } else if(pesan[0] == "search") {
            const feting = await axios.get("https://api.jikan.moe/v4/anime?"+new URLSearchParams({
                q : pesan.slice(1).join(" "),
            }), {
                validateStatus : (status) => {
                    return status < 500
                }
            })
            if(feting.status >= 400) throw "Ada Masalah"

            let teks = ""
            console.log(feting.data)
            feting.data.data.forEach((el : any, ind : number) => {
                teks += `${ind + 1}. ${el.title} ⭐${el.score} [${el.mal_id}] - ${el.url}\n`
            })

            await socket.sendMessage(room, {
                text: `Berhasil Mendapatkan anime search : \n\n${teks}`,
                mentions: [pengirim]
            })
        }
    } catch (err) {
        if(typeof err == "string") {
            throw err
        }
        throw "Ada masalah"
    }
}