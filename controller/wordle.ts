import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
import axios from 'axios';
export const types = /^wordle$/i
export const nama = "Wordle"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"wordle",
    getOptions()?.prefix+"wordle [jawaban]"
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
}: messageType) {
    if(pesan.length == 0) {
        const curWordle = getWordle(room)
        const date = new Date()
        const dates = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        if(curWordle == null) {

            const newCurWordle = await createWordle(room, dates)
            
            return await socket.sendMessage(room, {
                text : `Pertanyaan Wordle hari ini : `+
                `\n *${newCurWordle.answer.split("").map((el, ind) => newCurWordle.hint[ind] ? el : "_" ).join(" ")}*`
            })
        }
        if(curWordle.date == dates) {

            if(curWordle.winner != null) {
                return await socket.sendMessage(room, {
                    text : `Pertanyaan Wordle Hari ini sudah dijawab oleh ${"@" + curWordle.winner.replace("@s.whatsapp.net", "")}`+
                    `\nJawaban : ${curWordle.answer} \n`+
                    `\nJumlah Percobaan : ${curWordle.attempt}`+
                    "\nPercobaan : \n\t"+
                    `${curWordle.attemptText.map((el, ind) => (ind+1)+". "+el ).join("\n\t")}`,
                    mentions : [curWordle.winner]
                }, {
                    
                })
            }

             return await socket.sendMessage(room, {
            text : `Pertanyaan Wordle hari ini : `+
            `\n *${curWordle.answer.split("").map((el, ind) => curWordle.hint[ind] ? el : "_" ).join(" ")}*\nJumlah Percobaan : ${curWordle.attempt}`
        })
        } 

        
        const newCurWordle = await createWordle(room, dates)
            
        return await socket.sendMessage(room, {
            text : `Pertanyaan Wordle hari ini : `+
            `\n *${newCurWordle.answer.split("").map((el, ind) => newCurWordle.hint[ind] ? el : "_" ).join(" ")}*`
        })

    }

    const jawabanTest = pesan[0]
    const curWordle = getWordle(room)
    if(curWordle == null) {
        throw "Anda harus menginialisasi soal sebelum menjawabnya"
    }
    if(curWordle.winner != null) {
        throw "Wordle Hari ini Sudah Dijawab dengan benar. Coba Lagi Besok"
    }
    let curHint = curWordle.hint
    if(jawabanTest.length != curWordle.answer.length) {
        throw "Jumlah huruf yang anda ketik tidak sama dengan jumlah huruf dari jawabannya"
    } 

    const benars : boolean[] = curHint 
    let benarSemua = true
    curWordle.answer.split("").forEach((el, ind) => {
        if(el == jawabanTest.at(ind)) {
            benars[ind] = true
        } else {
            benarSemua = false
        }

    })

    curWordle.hint = curWordle.hint.map((el, ind) => el ? true : benars[ind] )
    curWordle.attempt++
    curWordle.attemptText.push(jawabanTest)

    if(benarSemua) {
        curWordle.winner = pengirim
    }
    
    saveWordle(room, curWordle)

    throw `Jawaban Anda : \n\n`+
    `${jawabanTest.split("").map((el, ind) => {
        if(benars[ind] == true) {
            return `*${el}*`
        }
        return `~${el}~`
    }).join(" ")} ${benarSemua ? `\n\n*Anda Benar*` : ""}`
   
}


type jidSetting  = {
    [key : string] : {
        attempt : number,
        winner? : string,
        attemptText : string[],
        answer : string,
        date : string,
        hint : boolean[]
    }
}
function getWordle(room : string) : jidSetting[string] | null{
    const opt = getOptions()
    if(opt.wordle == null) {
        opt.wordle = {}
    }
    const wordle : jidSetting = opt.wordle
    return wordle[room]
}

async function createWordle(room : string, dates : string) {
    
    const feting = await axios.get(`https://www.nytimes.com/svc/wordle/v2/${dates}.json`, {
        validateStatus : (st) => st <= 500 
    })
    if(feting.status >= 400) throw "Ada Masalah"
    const answer : string = feting.data.solution
    const newCurWordle : jidSetting[string] = {
        answer : answer,
        attempt : 0,
        attemptText : [],
        date : dates,
        hint : answer.split("").map(el => false) 
    }
    saveWordle(room, newCurWordle)
    return newCurWordle
}

function saveWordle(room : string, data : jidSetting[string]) {
    const opt = getOptions()
    if(opt.wordle == null) {
        opt.wordle = {}
    }
    const wordle : jidSetting = opt.wordle
    wordle[room] = data
    setOptions(wordle, "wordle")
}



