import * as fs from "fs"
const Files = fs.readdirSync("./controller")
export const kategoris : {[key:string] : Array<String>} = {}
const ControllerFunctions = Files.map(el => {
    if(!el.endsWith(".ts")) return 
    const file = require("./controller/"+el)
    if(!Object.keys(kategoris).includes(file.kategori)) {
        kategoris[file.kategori] = []
    }
    kategoris[file.kategori].push(`${file.nama} ${file.isGroup ? "(Group Only)" : ""} ${file.isAdmin ? "(Admin Group Only)" : ""} : ${file.bantuan.join(", ")}`)
    return file
})

console.log(ControllerFunctions)
export default ControllerFunctions
