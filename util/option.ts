import * as fs from "fs"
export function getOptions() {
    delete require.cache[require.resolve("../option.json")];
    const option = require("../option.json")
    return option
}

export function setOptions(val:any, key:string) {
    try {
        delete require.cache[require.resolve("../option.json")];
        const options = require("../option.json")
        fs.writeFileSync("option.json", JSON.stringify({
            ...options,
            [key] : val
        }, null, 2) )
    }catch(err) {
        console.log(err)
    }
}