// auth/auth-state.ts

import {
    AuthenticationState,
    BufferJSON,
    initAuthCreds,
    proto,
    SignalDataSet
} from "@whiskeysockets/baileys";

import { JsonStore } from "./json-store";
import { RedisStore } from "./redis-store";

export async function useRedisAuthState(
    redisStore: RedisStore,
    jsonStore: JsonStore,
    sessionId: string
): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}> {

    const redisKey = `baileys:${sessionId}`;

    let data = await redisStore.read(redisKey);

    // fallback JSON
    if (!data) {
        data = await jsonStore.read();

        if (Object.keys(data).length) {
            await redisStore.write(redisKey, data);
        }
    }

    data ||= {};

    const creds = data.creds || initAuthCreds();
    const keys = data.keys || {};

    const state: AuthenticationState = {

        creds,

        keys: {

            get(type, ids) {

                const result: any = {};

                for (const id of ids) {

                    const value = keys[type]?.[id];

                    if (value) {

                        result[id] =
                            type === "app-state-sync-key"
                                ? proto.Message.AppStateSyncKeyData.fromObject(value)
                                : value;
                    }
                }

                return result;
            },

            async set(dataToSet) {

                for (const category of Object.keys(dataToSet) as (keyof SignalDataSet)[]) {
                    keys[category] ??= {};

                    Object.assign(
                        keys[category]!,
                        dataToSet[category]!
                    );
                }
            }

        }

    };

    async function saveCreds() {

        const auth = {
            creds: state.creds,
            keys
        };

        try {

            await redisStore.write(redisKey, auth);

            await jsonStore.write(auth);

        } catch {

            // Redis gagal
            await jsonStore.write(auth);
        }
    }

    return {
        state,
        saveCreds
    };
}