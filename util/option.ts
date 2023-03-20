import * as fs from "fs"
export function getOptions() {
    
    const option = JSON.parse(fs.readFileSync("option.json", "utf-8"))
    return option
}

export function setOptions(val:any, key:string) {
    try {
        console.log(val, key)
        const options = require("../option.json")
        fs.writeFileSync("option.json", JSON.stringify({
            ...options,
            [key] : val
        }, null, 2) )
    }catch(err) {
        console.log(err)
    }
}