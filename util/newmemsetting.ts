import * as fs from "fs"
import imageSize from "image-size"
import * as path from "path"
import { getOptions, setOptions } from "./option"

export { getOptions }

export function setNewMem(room : string, message : string, gambar : string | null) {
    try {
        const options : any = getOptions()
        if(options.newmem == null) {
            options.newmem = {

            }
        }
        
        const groupSetting = options.newmem

        console.log(groupSetting)
        
        const newNewMem = {
            ...groupSetting,
            [room] : {
                message,
                image : gambar
            }
        }
        
        setOptions(newNewMem, "newmem")
    }catch(err) {
        console.log(err)
    }
}