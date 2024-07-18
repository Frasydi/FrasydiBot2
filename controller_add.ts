import * as fs from "fs"
export const kategoris = () => {
    const Files = fs.readdirSync("./controller")
    const result: { [key: string]: Array<String> } = {}
    Files.forEach(el => {
        if (!el.endsWith(".ts")) return
        delete require.cache[require.resolve("./controller/"+el)];
        const file = require("./controller/" + el)
        if (!Object.keys(result).includes(file.kategori)) {
            result[file.kategori] = []
            
        }
        result[file.kategori].push(`${file.nama} ${file.isGroup ? "(Group Only)" : ""} ${file.isAdmin ? "(Admin Group Only)" : ""} : ${file.bantuan.join(", ")}`)
    })
    return result
}
const ControllerFunctions = () => {
    const Files = fs.readdirSync("./controller")
    return Files.map(el => {
        if (!el.endsWith(".ts")) return
        delete require.cache[require.resolve("./controller/"+el)];
        const file = require("./controller/" + el)
        return file
    })
    
}

console.log(ControllerFunctions())
export default ControllerFunctions
