import { downloadMediaMessage, WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import convertQuoted2MsgInfo from '../util/convertQuoted2MsgInfo';
import * as fs from "fs"
import childprocess, { exec } from 'child_process';
import { getOptions } from '../util/option';
import { id_ID as faker, faker as orifaker } from "@faker-js/faker"
import * as vm from "vm"
import path from "path"
import myQueue from '../util/queue';
export const types = /lab/i
export const nama = "Modul Lab"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix + "lab modul set [nama lab] [bab]",
    getOptions()?.prefix + "lab modul delete [nama lab] [bab]",
    getOptions()?.prefix + "lab modul [nama lab] [bab]",
    getOptions()?.prefix + "lab tugas nim",
]
export const isGroup = false
export const isAdmin = false

type JawabanSoal = {
    nama: string,
    no_hp: string,
    alamat: string,
    umur: number,
    rumus: {
        soal: string,
        paramsJawaban: any,
        jawaban?: number,
        funcName: string
    },
    userNama: string,
    pengirim: string,
    teksSoal?: string,
    isJawab?: boolean
}

function isConst(this: any, name: any, context: any) {
    // does this thing even exist in context?
    context = context || this;
    if (typeof context[name] === "undefined") return false;
    // if it does exist, a reassignment should fail, either
    // because of a throw, or because reassignment does nothing.
    try {
        var _a = context[name];
        context[name] = !context[name];
        if (context[name] === _a) return true;
        // make sure to restore after testing!
        context[name] = _a;
    } catch (e) { return true; }
    return false;
}

(isConst as any).bind(this);

const rumusPilihan = [{
    name: "luas lingkaran",
    funcName: "luasLingkaran",
    rumusAsli: (...args: number[]) => {
        return 3.14 * (args[0] * args[0])
    },
    generator: () => {
        return {
            r: Math.floor(Math.random() * 29 + 1)
        }
    }
},
{
    name: "luas segitiga",
    funcName: "luasSegitiga",
    rumusAsli: (...args: number[]) => {
        return 1 / 2 * args[0] * args[1]
    },
    generator: () => {
        return {
            r: Math.floor(Math.random() * 29 + 1),
            a: Math.floor(Math.random() * 29 + 1),
        }
    }
},
{
    name: "luas persegi",
    funcName: "luasPersegi",
    rumusAsli: (...args: number[]) => {
        return args[0] * args[0]
    },
    generator: () => {
        return {
            s: Math.floor(Math.random() * 29 + 1),
        }
    }
},
] as const

export default async function Penting(socket: WASocket, {
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
    isOwner
}: messageType) {
    if (pesan.length == 0) throw "Harap Masukkan parameter utama. Pilihannya antara lain : module, login, atau register"
    if (pesan[0] == "modul") {
        if (isGroup) throw "Fitur ini tidak tersedia di grub. Harap akses lewat chat pribadi"

        if (pesan.length < 1) {
            const getRooms = getPentingList()
            throw `List-list Modul\n\n${getRooms.map((el, ind) => (ind + 1) + "." + el + "\n\t")}`
        }

        if (pesan[1] == "set") {
            if (!isOwner) throw "Hanya Pemilik Materi yang bisa mengakses ini"
            if (pesan.length < 2) throw "Harus Menginclude Nama Lab dan modul"
            if (pesan.length < 3) throw "Harus Menginclude Nama Urutan Modul"
            if (quoted == null) throw "Harus menquoted pesan"
            const lab = pesan[2].trim()
            const bab = pesan[3].trim().toLocaleLowerCase()
            if (quoted_type == "videoMessage") throw "Harus Quoted pesan teks atau teks gambar saja"
            else if (quoted_type == "imageMessage") {

                const buffer = await downloadMediaMessage(convertQuoted2MsgInfo(messageInstance), "buffer", {});
                console.log(messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1))
                const file = lab + "-" + pesan[1] + "." + messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1)
                if (!fs.existsSync("media/penting/" + lab)) {
                    fs.mkdirSync("media/penting/" + lab, {
                        recursive: true
                    })
                }
                if (!fs.existsSync("media/temp")) {
                    fs.mkdirSync("media/temp")
                }
                try {
                    fs.writeFileSync("media/temp/" + "penting" + file, buffer as Buffer)
                    childprocess.execSync(`cwebp -q 90 ${"media/temp/" + "penting" + file} -o ${"media/penting/" + lab + "/" + bab + ".webp"}`)
                } catch (err) {
                    console.log(err)
                    return await socket.sendMessage(room, { text: "Ada masalah" })
                }

                setPenting(lab, bab, {
                    file: lab + "/" + bab + ".webp",
                    text: quoted.imageMessage?.caption || quoted.conversation || "",
                    type: "image",
                    mimetype: messageInstance.message?.imageMessage?.mimetype || ""
                })

                fs.unlinkSync("media/temp/penting" + file)

            } else if (quoted_type == "documentMessage") {
                const buffer = await downloadMediaMessage(convertQuoted2MsgInfo(messageInstance), "buffer", {});
                console.log(messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1));
                const file = lab + "-" + quoted.documentMessage?.fileName;

                if (!fs.existsSync("media/penting/" + lab)) {
                    fs.mkdirSync("media/penting/" + lab, {
                        recursive: true
                    })
                }

                try {

                    fs.writeFileSync("media/penting/" + lab + "/" + file, buffer as Buffer)

                } catch (err) {

                    console.log(err)
                    return await socket.sendMessage(room, { text: "Ada masalah" })

                }
                setPenting(lab, bab, {
                    file: lab + "/" + file,
                    text: quoted.documentMessage?.fileName || "test",
                    type: "document",
                    mimetype: messageInstance.message?.documentMessage?.mimetype || ""
                })
            } else {

                setPenting(lab, bab, {
                    file: null,
                    text: messageInstance.message?.conversation || "",
                    type: "document",

                })

            }

            await socket.sendMessage(room, {
                text: `Berhasil Mengupdate setting pesan untuk new member`,
                mentions: [pengirim]
            })

        } else {


            if (pesan.length < 2) {
                const getRooms = getPentingList(pesan[1])
                throw `List-list Modul dari Lab ${pesan[1]} \n\n${getRooms.map((el, ind) => "\t" + (ind + 1) + "." + el + "\n")}`
            }

            const lab = pesan[1].trim()
            const bab = pesan[2].trim().toLocaleLowerCase()

            const myPenting = getPenting(lab, bab)

            try {
                if (myPenting.type == "document") {
                    await socket.sendMessage(room, {
                        document: fs.readFileSync("media/penting/" + myPenting.file),
                        mimetype: myPenting.mimetype || "",
                        fileName: myPenting.text
                    })
                } else if (myPenting.type == "image") {
                    await socket.sendMessage(room, {
                        image: fs.readFileSync("media/penting/" + myPenting.file),
                        mimetype: myPenting.mimetype || "",
                        caption: myPenting.text
                    })
                } else {
                    await socket.sendMessage(room, {
                        text: myPenting.text
                    })
                }

            } catch (err) {

                throw "Ada Masalah"

            }

        }
    } else if (pesan[0] == "tugas") {
        if (isGroup) throw "Fitur ini tidak tersedia di grub. Harap akses lewat chat pribadi"

        if (pesan.length < 2) throw "Harus memasukkan nim dan nama"

        if (pesan.length < 3) {
            const myUser = getUser(pesan[1])
            if (myUser == null) throw "Harus Memasukkan Nama"
            if (myUser.soal == null) {
                throw "Harus Memasukkan Nama"
            }
            if (myUser.soal.pengirim != pengirim) {
                throw "Nomor yang digunakan untuk membuat soal berbeda dengan nomor yang digunakan saat ini"
            }
            await socket.sendMessage(room, {
                text: myUser.soal.teksSoal
            })
            return

        }
        const myUser = getUser(pesan[1])
        if (myUser != null) throw "NIM Anda sudah terdaftar, dan anda harus menjawab soal yang sudah ada. "
        const rumus: typeof rumusPilihan[number] = getRandomFromArray(rumusPilihan as unknown as string[])

        const jawaban: JawabanSoal = {
            nama: getRandomFromArray(faker.person?.first_name?.generic as string[]) + " " + getRandomFromArray(faker.person?.last_name?.generic as string[]),
            no_hp: "08" + generateRandom9DigitNumber(),
            alamat: orifaker.location?.streetAddress(true),
            umur: Math.floor(Math.random() * 13 + 18),
            rumus: {
                soal: "Buatkanlah Sebuah Fungsi yang bernama " + rumus.funcName + " yakni fungsi yang menghitung " + rumus.name,
                paramsJawaban: rumus.generator(),
                funcName: rumus.funcName
            },
            userNama: pesan.slice(2).join(" "),
            pengirim

        }

        jawaban.rumus.jawaban = rumus.rumusAsli(...Object.values(jawaban.rumus.paramsJawaban as number))

        jawaban.teksSoal = `Soal untuk ${pesan.slice(2).join(" ")}\n\n` +
            `\t1. Buatkan sebuah variabel bernama "nama" yang menggunakan 'let' dan bertipe 'string', di mana nilai yang harus diisikan adalah '${jawaban.nama}'\n\n` +
            `\t2. Buatkan sebuah variable bernama "no_hp" yang menggunakan 'const' dan bertipe 'string', di mana nilai yang harus diisikan adalah '${jawaban.no_hp}'\n\n` +
            `\t3. Buatkan sebuah variable bernama "alamat" yang menggunakan 'let' dan bertipe 'string', di mana nilai yang harus diisikan adalah '${jawaban.alamat}'\n\n` +
            `\t4. Buatkan sebuah variable bernama "umur" yang menggunakan 'const' dan bertipe 'number', di mana nilai yang harus diisikan adalah '${jawaban.umur}'\n\n` +
            `\t5. ${jawaban.rumus.soal}\n\nSoal ini hanya bisa dijawab menggunakan bahasa pemograman javascript. Typescript tidak diperbolehkan`

        console.log(jawaban)

        setUser(pesan[1], "soal", jawaban)


        throw jawaban.teksSoal
    } else if (pesan[0] == "jawabSoal") {
        if (isGroup) throw "Fitur ini tidak tersedia di grub. Harap akses lewat chat pribadi"

        if (pesan.length < 2) throw "Harus Masukkan NIM"
        if (pesan.length < 3) throw "Harus Masukkan Kode"

        console.log(pesan.slice(2))
        const mahasiswa = getUser(pesan[1])
        if (mahasiswa == null) {
            throw "Anda belum menggunakan command untuk membuat soal. Harap gunakan command itu untuk menggenerate soal untuk Anda"
        }
        if (mahasiswa?.soal == null) {
            throw "Anda belum menggunakan command untuk membuat soal. Harap gunakan command itu untuk menggenerate soal untuk Anda"
        }
        if (mahasiswa.soal.pengirim != pengirim) {
            throw "Anda hanya bisa menjawab menggunakan nomor WA yang anda gunakan ketika membuat soal"
        }
        const hasil = await compileTypeScript(mahasiswa?.soal, pesan.slice(2).join(" "))
        const lab = getLab()

        if (lab.juara == null) {
            lab.juara = []
        }


        lab.juara.push({
            nama: mahasiswa.soal.userNama,
            pengirim: pengirim,
            nim: pesan[1]
        })

        await socket.sendMessage(room, {
            text: "Anda berhasil menjawab tugas ini dengan meraih urutan sebagai penjawab tercepat yang ke " + lab.juara.length
        })

        setLab(lab.juara, "juara")
        mahasiswa.soal.isJawab = true
        setUser(pesan[1], "soal", mahasiswa.soal)

        // if (lab.juara.length % 5 == 0) {
        //     await socket.sendMessage("120363028233988425@g.us", {
        //         text: "Sudah terdapat " + lab.juara.length + " orang yang berhasil menjawab tugas"
        //     })
        // }

    } else if (pesan[0] == "listSelesai") {
        if (isGroup) throw "Perintah ini tidak tersedia di grub"

        const lab = getLab()
        if (lab?.juara == null) throw "Belum ada yang selesai"

        const text = lab?.juara.map((el: { pengirim: string, nama: string }, ind: number) => {
            return `${ind + 1}. ${el.nama}`
        }).join("\n")

        await socket.sendMessage(room, {
            text: `List-list mahasiswa yang berhasil menjawab tugas (diurutkan berdasarkan dari yang tercepat)\n\n` + text,
            mentions: lab?.juara.map((el: any) => el.pengirim)
        })

    }

}

type dataHasil = { file: string | null, text: string, type: "image" | "document" | "text", mimetype?: string }

function getRandomFromArray(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function getPenting(room: string, key: string): dataHasil {
    const opt = getLab()
    if (opt.penting == null) {
        throw "Kosong"
    }
    if (opt.penting[room] == null) {
        throw "Tidak Menemukan Nama Lab"
    }
    if (opt.penting[room]?.[key] == null) {
        throw "Tidak Menemukan Modul"
    }
    return opt.penting[room][key]
}

async function setPenting(room: string, key: string, data: dataHasil) {
    const opt = getLab()
    if (opt.penting == null) {
        opt.penting = {}
    }
    if (opt.penting[room] == null) {
        opt.penting[room] = {}
    }

    opt.penting[room][key] = data

    await setLab(opt.penting, "penting")

}

function generateRandom9DigitNumber() {
    let randomNumber = '';

    for (let i = 0; i < 9; i++) {
        // Generate a random digit between 0 and 9 and append it
        randomNumber += Math.floor(Math.random() * 10);
    }

    return randomNumber;
}


async function setUser(nim: string, key: string, value: any) {
    const opt = getLab()
    if (opt.users == null) {
        opt.users = {}
    }
    if (opt.users[nim] == null) {
        opt.users[nim] = {}
    }

    opt.users[nim][key] = value
    await setLab(opt.users, "users")
}


function getUser(nim: string) {
    const opt = getLab()
    if (opt.users == null) {
        return null
    }

    return opt.users[nim]
}



function getPentingList(room?: string) {
    const opt = getLab()

    if (opt.penting == null) {
        throw "Kosong"
    }

    if (room == null) {
        return Object.keys(opt.penting)
    }

    if (opt.penting[room] == null) {
        throw "Tidak Menemukan Nama Lab"
    }

    return Object.keys(opt.penting[room])
}


function getLab() {
    if (!fs.existsSync("../lab.json")) {
        fs.writeFileSync("../lab.json", JSON.stringify({}))
    }
    delete require.cache[require.resolve("../lab.json")];
    const option = require("../lab.json")
    return option
}

async function setLab(val: any, key: string) {
    await myQueue.add({ val, key })
}

function findConstDeclarations(code: string) {
    // Regular expression to match `const` variable declarations
    const constRegex = /\bconst\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;

    let match;
    const constVariables = [];

    // Loop through all matches in the code
    while ((match = constRegex.exec(code)) !== null) {
        const constVariable = match[1]; // Extract the variable name
        constVariables.push(constVariable);
    }

    return constVariables;
}

async function compileTypeScript(mahasiswa: JawabanSoal, sourceCode: string) {
    if (mahasiswa == null) throw "Anda Belum Menggenerate Soal"
    if (mahasiswa.isJawab) throw "Anda Sudah Menjawab Tugas ini"

    try {

        const myConst = findConstDeclarations(sourceCode)
        console.log(myConst)
        if (!myConst.includes("no_hp")) throw "Variable 'no_hp' harus ada dan bersifat const"
        if (!myConst.includes("umur")) throw "Variable 'umur' harus ada dan bersifat const"

        const soal: JawabanSoal = mahasiswa
        const script = new vm.Script(sourceCode + `\n\n
            if(nama != namaJawaban123) throw "Nilai dari variable 'nama' tidak sama dengan jawaban yang sudah ditentukan"
            
            if(no_hp != noHPJawaban123) throw "Nilai dari variable 'no_hp' tidak sama dengan jawaban yang sudah ditentukan"
            
            if(alamat != alamatJawaban123) throw "Nilai dari variable 'alamat' tidak sama dengan jawaban yang sudah ditentukan"
            
            if(umur != umurJawaban123) throw "Nilai dari variable 'umur' tidak sama dengan jawaban yang sudah ditentukan"

            if(typeof ${soal.rumus.funcName} != 'function') throw "Anda tidak membuat ${soal.rumus.funcName} sebagai sebuah fungsi"
            const jawaban123123 = ${soal.rumus.funcName}(...rumusParams)
            if(jawaban123123 != rumusJawaban123) throw "Hasil dari fungsi ${soal.rumus.funcName} salah"


            ` + "\n\n" + "'Anda berhasil menjawab soal'")
        //+"\n\n"+user.jawabanCode

        const vmContext = vm.createContext({
            namaJawaban123: soal.nama,
            alamatJawaban123: soal.alamat,
            umurJawaban123: soal.umur,
            noHPJawaban123: soal.no_hp,
            rumusJawaban123: soal.rumus.jawaban,
            rumusNama123: soal.rumus.funcName,
            rumusParams: Object.values(soal.rumus.paramsJawaban),
            isConst123123: isConst
        })
        const result = script.runInContext(vmContext, {
            displayErrors: true,

        })

        return result

    } catch (err) {
        console.log(err)
        throw "Ada Error pada kode VM" + "\n\n" + err

    }

}

