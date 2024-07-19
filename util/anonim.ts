import { getSock } from "..";
import { getOptions, setOptions } from "./option";
import { v4 as uuidv4 } from 'uuid';

const queuesJoin: {
    from: string,
    action: "exit" | "append"
}[] = []

export let anonims: {
    player : string[],
    id: string,
    intervalTimeOut?: ReturnType<typeof setTimeout>
}[] = []


export async function joinRoom(join: string,) {
    await queuePush(join, "append")
}

export async function exitRoom(from: string) {
    await queuePush(from, "exit")
}

export async function chatAnonim(from : string, chat : string) {
    const sock = await getSock()
    const inds = anonims.findIndex(el => el.player.includes(from))
    if(inds == -1) return
    const curAnonim = anonims[inds]
    const notMe = curAnonim.player.filter(el => el != from)[0]
    await sock?.sendMessage(notMe, {
        text : chat
    })

}


async function queuePush(from: string, action: typeof queuesJoin[number]["action"]) {
    const sock = await getSock()
    queuesJoin.push({
        from,
        action
    })

    if (queuesJoin.length > 1) return

    const curInter = setInterval(async () => {
        if (queuesJoin.length == 0) {
            clearInterval(curInter)
            return
        }
        const { from, action }: { from: string, action: typeof queuesJoin[number]["action"] } = queuesJoin[0]
        console.log(anonims)
        if (action == "append") {
            if (anonims.findIndex(el => el.player.includes(from)) != -1) {
                await sock?.sendMessage(from, {
                    text: "Anda Sudah Pernah Memasuki Room. Harap keluar dari room jika ingin masuk ke room lain"
                })
                queuesJoin.shift()
                return
            }
            const empty_room = anonims.filter(el => el.player[1] != null)
            if (empty_room.length == 0) {
                anonims.push({
                    player: [from],
                    id: uuidv4(),
                    intervalTimeOut: setTimeout(() => {
                        console.log("LOL")
                        console.log(queuesJoin)
                        queuePush(from, "exit")
                        
                    }, 60000)

                })

                await sock?.sendMessage(from, {
                    text: "Tidak Menemukan Orang. Anda boleh menunggu hingga 1 menit hingga menemukan orang"
                })
                queuesJoin.shift()
                return
            }

            const inds = Math.random() * (empty_room.length - 0) + 0
            const curanonim = anonims[inds]
            curanonim.player = [...curanonim.player,from]

            for(let player of curanonim.player) {
                await sock?.sendMessage(player, {
                    text: "Anda Berhasil Menemukan Teman Chat"
                })
            }
            clearTimeout(curanonim.intervalTimeOut)
            queuesJoin.shift()

            return
        } else {
            const inds = anonims.findIndex(el => el.player.includes(from))
            if(inds == -1) {
                await sock?.sendMessage(from, {
                    text: "Anda Belum Memasuki Room."
                })
                queuesJoin.shift()

                return
            }
           

            const curanonim = anonims[inds]

            if(curanonim.player.length == 1) {
                await sock?.sendMessage(curanonim.player[0], {
                    text: "Pencarian dihentikan"
                })
            } else {
                for(let player of curanonim.player) {
                    await sock?.sendMessage(player, {
                        text: "Chat ini dihentikan"
                    })
                }
            }

            anonims = anonims.filter((el, ind) => ind != inds)
            queuesJoin.shift()

            return
            
        }




        





    }, 2000)
}



