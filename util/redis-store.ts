import { BufferJSON } from "@whiskeysockets/baileys";
import Redis from "ioredis";

export class RedisStore {

    constructor(private redis: Redis) {}

    async read(key: string) {
        const value = await this.redis.get(key);

        if (!value) return null;

        return JSON.parse(value, BufferJSON.reviver);
    }

    async write(key: string, data: any) {
        await this.redis.set(
            key,
            JSON.stringify(data, BufferJSON.replacer)
        );
    }

    async delete(key: string) {
        await this.redis.del(key);
    }
}