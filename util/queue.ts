import Queue from "bull"
import * as fs from "fs"
import { env } from "process";
const myQueue = new Queue('options', {
    redis: {
        port: Number(env.REDIS_PORT) || 0,
        host: env.REDIS_HOST || "",
        password: env.REDIS_PASSWORD || ""
    }
});


myQueue.process(async (job) => {
    console.log(job.data);
    const { key, val }: { key: string, val: any } = job.data
    try {
        if (!fs.existsSync("../lab.json")) {
            fs.writeFileSync("../lab.json", JSON.stringify({}))
        }
        delete require.cache[require.resolve("../lab.json")];
        const options = require("../lab.json")
        fs.writeFileSync("lab.json", JSON.stringify({
            ...options,
            [key]: val
        }, null, 2))

        return
    } catch (err) {

        console.log(err)
        throw "Ada Masalah"

    }
});

export default myQueue