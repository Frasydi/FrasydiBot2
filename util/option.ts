import * as fs from "fs"
export function getOptions() {
    const option = require("../option.json")
    return option
}

export function setOptions(val:string, key:string) {
    try {
        const options = require("../option.json")
        fs.writeFileSync("../option.json", {
            ...options,
            [key] : val
        } )
    }catch(err) {
        console.log(err)
    }
}