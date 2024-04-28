import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { setNewMem } from '../util/newmemsetting';
import { auth, v2 } from 'osu-api-extended';
import { response } from 'osu-api-extended/dist/types/v2_beatmaps_search';
import { response as detailresponse} from 'osu-api-extended/dist/types/v2_beatmap_id_details';
export const types = /osu/i
export const nama = "Osu"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "osu search [search]",
    getOptions()?.prefix + "osu detail [id]",

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
        if (pesan.length < 2) throw "Parameter tidak lengkap"
        if (["search", "detail"].includes(pesan[0]) == false) throw "Harus mencantumkan tipe (search | detail)"

        await auth.login(31771, "WApc3O8wmzecVMLvLItmmoUJTJVXwxCvE2Rd49TI", ["public"])
        if (pesan[0] == "detail") {
            const data = (await v2.beatmap.id.details(parseInt(pesan[1])))
            console.log(data)
            let teks = `Title : ${data.beatmapset.title}\nArtist: ${data.beatmapset.artist}\nCreator : ${data.beatmapset.creator}\nDifficulty : ${data.difficulty_rating}\nJumlah Lingkaran : ${data.count_circles}\nJumlah Slider : ${data.count_sliders}\nJumlah Spinner : ${data.count_spinners}\nURL : ${data.url}`
            

            await socket.sendMessage(room, {
                caption: `Berhasil Mendapatkan detail beatmap : \n\n${teks}`,
                image : {
                    url : data.beatmapset.covers['list@2x'] ,
                    
                },
                mentions: [pengirim]
            }, {
                
            })
        } else if(pesan[0] == "search") {
            const data = (await v2.beatmaps.search({
                mode: "osu",
                query: pesan.slice(1).join(" "),
                section: "ranked"
            })) as unknown as response
            let teks = ""
            console.log(data)
            data.beatmapsets.forEach((el, ind) => {
                let diffList = ``
                el.beatmaps.forEach((el2, ind2) => {
                    diffList += `\t${ind2+1}). ${el2.version} - ${el2.difficulty_rating} command : ${getOptions()?.prefix}osu detail ${el2.id}  \n`
                })
                teks += `${ind + 1}. ${el.title}-${el.artist} [${el.creator}] \nDifficulty List : \n${diffList}\n`
            })

            await socket.sendMessage(room, {
                text: `Berhasil Mendapatkan beatmap search : \n\n${teks}`,
                mentions: [pengirim]
            })
        }
    } catch (err) {
        throw "Ada masalah"
    }
}