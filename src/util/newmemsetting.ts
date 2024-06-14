import * as fs from "fs"
import * as path from "path"
export function getOptions() {
    const option = require("../option.json")
    return option
}



export function setNewMem(room : string, message : string) {
    try {
        
        const options : any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../option.json"), "utf-8").toString())
        if(options.newmem == null) {
            options.newmem = {

            }
        }
        const groupSetting = options.newmem

        console.log(groupSetting)
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