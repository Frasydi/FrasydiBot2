// auth/json-store.ts

import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "sessions", "auth.json");

export class JsonStore {
    async read() {
        try {
            const data = await fs.readFile(FILE, "utf8");
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    async write(data: any) {
        await fs.mkdir(path.dirname(FILE), { recursive: true });

        await fs.writeFile(
            FILE,
            JSON.stringify(data, null, 2)
        );
    }
}