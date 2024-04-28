import * as fs from "fs"
export function getOptions() {
    const option = require("../option.json")
    return option
}



export function setNewMem(room : string, message : string) {
    try {
        
        const options = require("../option.json")
        if(options.newmem == null) {
            options.newmem = {

            }
        }
        const groupSetting = options.newmem
        fs.writeFileSync("option.json", JSON.stringify({
            ...options,
            newmem : {
                ...groupSetting,
                [room] : message
            }
        }, null, 2) )
    }catch(err) {
        console.log(err)
    }
}