import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /cekresi/i
export const nama = "Cek Resi"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"cekresi",
    getOptions()?.prefix+"cekresi [kode kuris]",
    getOptions()?.prefix+"cekresi [kode kurir] [kode resi]",
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
    if(pesan.length == 0) {
        const feting = await fetch("https://api.binderbyte.com/v1/list_courier?api_key="+process.env.CEKRESI)
        if(feting.status > 400) throw "Ada Masalah"
        const json : Array<{code : string, description : string}> = await feting.json()
        console.log(json)
        let text = `List Kurir\n`
        json.forEach(el => {
            text += `${el.code} - ${el.description}\n`
        })
        await socket.sendMessage(room, {
            text : text,
            mentions : [pengirim]
        }, {
            quoted : messageInstance
        })
        return
    }
    else if(pesan.length < 2) throw "Harus menginclude kode resi"
    const feting = await fetch(`https://api.binderbyte.com/v1/track?api_key=${process.env.CEKRESI}&courier=${pesan[0]}&awb=${pesan[1]}`)
    const json : {
        data : {
            summary : {
                awb : string,
                courier : string,
                service : string,
                status : string,
                date : string,
                desc : string,
                amount : string,
                weight : string
            },
            detail : {
                origin : string,
                destination : string,
                shipper : string,
                receiver : string
            },
            history : Array<{
                date : string,
                desc : string,
                location : string
            }>
        },
        message : string,
        status : number
    }  = await feting.json()
    if(json.status >= 400) {
        throw json.message
    }
    console.log(json.data)

    const histText = json.data.history.map((el, ind) => `\t -- ${el.date} - ${el.desc} ${el.location.trim().length == 0 ? "" : `[${el.location}]`}`).join("\n")

    await socket.sendMessage(room, {
        text : `Detail Resi ${json.data.summary.awb}\n`+
                `Kurir : ${json.data.summary.courier}\n`+
                `Service : ${json.data.summary.service}\n`+
                `Pengirim : ${json.data.detail.shipper}\n`+
                `Penerima: ${json.data.detail.receiver}\n`+
                `Asal : ${json.data.detail.origin}\n`+
                `Destinasi: ${json.data.detail.destination}\n`+
                `Status: ${json.data.summary.status}\n\n`+
                `Riwayat : \n${histText}`
                ,
        mentions : [pengirim]
    }, {
        quoted : messageInstance
    })
}