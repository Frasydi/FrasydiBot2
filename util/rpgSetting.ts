import { getOptions, setOptions } from "./option";

export const tier = { "E": 70, "D": 50, "C": 30, "B": 10, "A": 5, "S": 1 }

export type tierType = {
    [key in keyof typeof tier]?: number
}

export type tierStatus = keyof typeof tier
export type itemType = "potion" | "common" | "armor" | "weapons"

export type armorType = "chestplate" | "helmet" | "leggings" | "boot"

export type armor = {
    nama: string,
    stats: Playerstatus,
    tier: tierStatus,
    type: armorType,
    id: number,
    tipe: "armor",
    deskripsi: string,

}

export type weapons = {
    nama: string,
    stats: Playerstatus,
    tier: tierStatus,
    id: number,
    tipe: "weapons",
    deskripsi: string,

}

export type potionscommon =
    {
        nama: string,
        deskripsi: string,
        kegunaan: (player: RPGPlayer[string]) => string,
        tier: tierStatus,
        id: number,
        tipe: "potion" | "common"
    }


export type playerItems = items & { stack: number }

export type items = (potionscommon | armor | weapons) & { max_stack: number, cost : number }

export const items: items[] = [
    {
        nama: "Health Potion S",
        deskripsi: "Sebuah Potion untuk menambahkan HP pemain sebesar 50",
        kegunaan: (player) => {
            addHealth(player, 50)
            return "Menambah nyawa sebesar 50"
        },
        max_stack: 100,
        tier: "E",
        tipe: "potion",
        id: 1,
        cost : 20
    },
    {
        nama: "Experience Potion S",
        kegunaan: (player) => {
            return experienceUp(player, 50)

        },
        deskripsi: "Sebuah Potion untuk menambahkan EXP pemain sebesar 50",
        max_stack: 10,
        tier: "D",
        tipe: "potion",
        id: 2,
        cost : 20
    },
    {
        nama: "Leather Chestplate",
        deskripsi: "Hanya Sebuah Chestplate biasa",
        stats: {
            agi: 0,
            int: 0,
            lucky: 0,
            strength: 0,
            vit: 1
        },
        tier: "E",
        type: "chestplate",
        id: 3,
        tipe: "armor",
        max_stack: 10,
        cost : 20
    },
    {
        nama: "Wooden Sword",
        deskripsi: "Hanya Sebuah Pedang Kayu",
        stats: {
            agi: 0,
            int: 0,
            lucky: 0,
            strength: 1,
            vit: 0
        },
        tier: "E",
        id: 4,
        tipe: "weapons",
        max_stack: 10,
        cost : 20

    }
]







export type Playerstatus = {
    strength: number,
    agi: number,
    int: number,
    lucky: number,
    vit: number
}



export const rasBonusStart: {
    [key in rasType]: {
        base_start: Playerstatus
    }
} = {
    manusia: {
        base_start: {
            agi: 2,
            int: 4,
            lucky: 5,
            strength: 2,
            vit: 1
        }
    },
    elf: {
        base_start: {
            agi: 4,
            int: 6,
            lucky: 2,
            strength: 2,
            vit: 1
        }
    },
    beast: {
        base_start: {
            agi: 1,
            int: 2,
            lucky: 1,
            strength: 5,
            vit: 5
        }
    }
}

export const travels: {
    name: string,
    isSafeArea: boolean,
    itemsLoot: Array<items & {
        dropRate: number
    }>,
    id: number
}[] = [
        {
            name: "Village",
            isSafeArea: true,
            itemsLoot: [],
            id: 1
        },
        {
            name: "Forest",
            isSafeArea: false,
            itemsLoot: [
                { ...items[0], dropRate: 50 },
                { ...items[1], dropRate: 30 },
            ],
            id: 2
        }
    ]

export type rasType = "manusia" | "elf" | "beast"

export type RPGPlayer = {
    [key: string]: {
        money: number,
        ras: rasType,
        health: number,
        max_health: number
        level: number,
        experience: number,
        max_experience: number,
        stats: Playerstatus,
        statsPoin: number,
        armor: {
            [key in armorType]: items | null
        },
        weapon: items | null
        items: Array<playerItems>,
        location: number,
        advTimeOut: number
    }
}

export type RPGGroup = {
    player: string[],
    nama: string
}[]

export type CurFight = {
    host: string,
    opponet: string
}[]

export function experienceUp(player: RPGPlayer[string], exp: number) {
    player.experience += exp
    if (player.experience >= player.max_experience) {
        player.level += 1
        player.max_experience += 300
        player.statsPoin += 5

        return "Anda Naik Level ke "+player.level
    }
    return "EXP Anda naik sebesar "+exp
}

export function startCharacter(from: string, ras: rasType) {

    if(!Object.keys(rasBonusStart).includes(ras)) {
        throw "Ras Yang Dimaksud Tidak Ada"
    }

    const armorStats = changeStats(rasBonusStart[ras].base_start, (items[2] as armor).stats)
    const weaponsStats = changeStats(armorStats, (items[3] as weapons).stats)

    const getObj = getRPG()
    if (getObj[from] != null) throw "Anda Sudah Memiliki Akun RPG"

    setRpgPlayer(from, {
        armor: {
            boot: null,
            chestplate: items[2],
            helmet: null,
            leggings: null
        },
        experience: 0,
        health: 100,
        max_health: 100,
        max_experience: 300,
        items: [
            {
                ...items[0],
                stack: 5
            }
        ],
        level: 1,
        money: 500,
        ras: ras,
        stats: weaponsStats,
        statsPoin: 3,
        weapon: items[3],
        location: 0,
        advTimeOut: 0
    })

    return "Anda Berhasil Membuat Akun"
}

const adjustDropRatesForLuck = (luck: number, itemLocation: typeof travels[number]["itemsLoot"]): typeof travels[number]["itemsLoot"] => {

    const luckFactor = (100 + luck) / 100;
    return itemLocation.map(el => ({
        ...el,
        dropRate: el.dropRate * luckFactor
    }))

};

const ajdustDropRatesFromTiers = (luck: number, tierAvailable: (keyof typeof tier)[]): tierType => {
    const luckFactor = (100 + luck) / 100;
    const newTier: tierType = {

    }
    for (let key of tierAvailable) {
        const keyd = key as keyof typeof tier

        newTier[keyd] = tier[keyd] * luckFactor
    }

    return newTier
}

const selectRandomItem = (items: typeof travels[number]["itemsLoot"], player: RPGPlayer[number]): number => {
    const uniqueTiers = Array.from(new Set(items.map(el => el.tier)))
    if (uniqueTiers.length == 0) {
        console.log(items)
        throw "Ada Masalah"
    }
    const adjustedTiers = ajdustDropRatesFromTiers(player.stats.lucky, uniqueTiers)
    const tiersKeys = Object.keys(adjustedTiers)
    const tierWeight = Object.values(adjustedTiers);
    const selectedTiers = weightedRandom(tierWeight);
    console.log(adjustedTiers)
    console.log(uniqueTiers)
    const itemAdjusted = adjustDropRatesForLuck(player.stats.lucky, items.filter(el => el.tier == tiersKeys[selectedTiers])).sort((a, b) => {
        if (a.dropRate < b.dropRate) {
            return -1
        } else {
            return 1
        }
    })

    console.log(itemAdjusted)

    const itemWeights = itemAdjusted.filter(el => el.tier == tiersKeys[selectedTiers]).map(el => el.dropRate);
    const selectedItemIndex = weightedRandom(itemWeights);

    return itemAdjusted[selectedItemIndex].id;
};

export function myProfileRPG(from : string) {
    const myrpg = getMyRPGPlayer(from)

    const text = 
    "Berikut adalah profil RPG dari "+("@" + from.replace("@s.whatsapp.net", "")) + ": \n"+
    "HP : "+myrpg.health + "/"+ (myrpg.max_health * ((myrpg.stats.vit + 100)/ 100))+"\n"+
    "Level : "+myrpg.level +"\n"+
    "Exp : "+myrpg.experience +"/"+myrpg.max_experience+"\n\n"+
    "Stats Poin : "+ myrpg.statsPoin+"\n"
    "Stats \n\t"+
    `agi: ${myrpg.stats.agi}\ntint: ${myrpg.stats.int}\ntlucky: ${myrpg.stats.lucky}\ntstrength: ${myrpg.stats.strength}\ntvit: ${myrpg.stats.vit}\n`+
    ""

    return text
}

export function adventure(from: string) {
    const myrpg = getMyRPGPlayer(from)
    if (myrpg.advTimeOut > Date.now()) {
        // Menghitung selisih waktu dalam milidetik
        const differenceInMilliseconds = myrpg.advTimeOut - Date.now();

        // Mengonversi milidetik ke unit waktu yang diinginkan
        const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
        const differenceInMinutes = Math.floor(differenceInSeconds / 60);
        const differenceInHours = Math.floor(differenceInMinutes / 60);



        throw "Anda Bisa Melakukan Eksplore lagi dalam " +`${differenceInHours} jam : ${differenceInMinutes} menit : ${differenceInSeconds} detik`
    }
    if (travels[myrpg.location].isSafeArea == true) {
        throw "Area ini (" + travels[myrpg.location].name + ") tidak dapat diexplore"
    }
    const poolItems: playerItems[] = []
    const jumlah_drop_items = Math.random() * (((myrpg.level * 5 + 2)) - (myrpg.level * 5)) + (myrpg.level * 5)
    for (let i = 0; i < jumlah_drop_items; i++) {
        const id = selectRandomItem(travels[myrpg.location].itemsLoot, myrpg)
        const indFind = items.findIndex(el => el.id == id)

        const curPoolInd = poolItems.findIndex(el => el.id == id)
        if (curPoolInd == -1) {
            poolItems.push({ ...items[indFind], stack: 1 })
            continue
        }
        poolItems[curPoolInd].stack++
    }

    addItemsIntoPlayer(myrpg, poolItems)

    const exp = ((myrpg.stats.lucky + 100) / 100) * 10

    const experience = experienceUp(myrpg, exp)


    const timesNow = new Date()

    timesNow.setHours(timesNow.getHours() + 1)
    myrpg.advTimeOut = timesNow.getTime()
    setRpgPlayer(from, myrpg)
    return `Anda Berhasil Menjalajahi area ini. ${experience} Anda menemukan item-item berikut : \n` + poolItems.map(el => el.nama + " x" + el.stack + " - " + el.tier).join(" | ")
}

export function travel(from: string, to: number) {
    const findIndex = travels.findIndex(el => el.id == to)
    if (findIndex == -1) throw "Tidak Menemukan Lokasi Yang Dimaksud"
    const myrpg = getMyRPGPlayer(from)
    myrpg.location = findIndex
    setRpgPlayer(from, myrpg)

    return "Anda Berpindah ke " + travels[findIndex].name
}

export function getMyItem(from: string) {
    const myrpg = getMyRPGPlayer(from)
    return `Anda Memiliki Item-item berikut : \n${myrpg.items.map((el, ind) => (ind + 1) + ". " + el.nama +` (${el.id})` +" x" + el.stack + "/" + el.max_stack + ` tier ${el.tier}, tipe ${el.tipe}, : \n\t\t` + el.deskripsi).join("\n")}`
}

export function useItem(from : string, id : number) {
    const myrpg = getMyRPGPlayer(from)
    const indFind = myrpg.items.findIndex(el => el.id == id)
    if(indFind == -1) throw "Tidak Menemukan Item ini di inv anda"
    if(!["potion", "common" ].includes(myrpg.items[indFind].tipe )) {
        throw "Hanya Potion dan Item Common yang bisa digunakan"
    }
    const item  = myrpg.items[indFind] as potionscommon
    console.log(item)
    const result = item.kegunaan(myrpg)
    myrpg.items[indFind].stack--
    if(myrpg.items[indFind].stack <= 0) {
        myrpg.items =  myrpg.items.filter(el => el.id != id)
    } 
    setRpgPlayer(from,myrpg)
    return result
}



function addHealth(player : RPGPlayer[number], health : number) {
    player.health+=health
    const maxH = player.max_health * ((player.stats.vit + 100)/ 100)
    if(player.health > maxH) {
        player.health = maxH
    }
}

function addItemsIntoPlayer(player: RPGPlayer[number], itemAdd: playerItems[]) {
    itemAdd.forEach(el => {
        const findInd = player.items.findIndex(el2 => el.id == el2.id)
        if (findInd == -1) {
            player.items.push(el)
        } else {
            player.items[findInd].stack++
            player.items[findInd].stack = player.items[findInd].stack > player.items[findInd].max_stack ? player.items[findInd].max_stack : player.items[findInd].stack
        }
    })
}




function changeStats(curStats: Playerstatus, armorStats: Playerstatus) {
    const newStats: Playerstatus = {
        agi: 0,
        int: 0,
        lucky: 0,
        strength: 0,
        vit: 0
    }
    for (let keys in curStats) {
        const key = keys as keyof Playerstatus
        newStats[key] = curStats[key] + armorStats[key]
    }
    return newStats
}

export async function fight(from: string, to: string) {

}

function getRPG(): RPGPlayer {
    const opt = getOptions()
    if (opt.rpg == null) opt.rpg = {}
    return opt.rpg
}

function setRpgPlayer(from: string, value: RPGPlayer[string]) {
    const rpg = getRPG()
    rpg[from] = value

    setOptions(rpg, "rpg")
}

function getMyRPGPlayer(from: string) {
    const rpg = getRPG()
    if (rpg[from] == null) throw "Karakter ini belum dibuat"
    return rpg[from]
}

function weightedRandom(weights: number[]): number {
    const sum = weights.reduce((acc, weight) => acc + weight, 0);
    const random = Math.random() * sum;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
            return i;
        }
    }
    return 0;
};