import { WASocket } from '@adiwajshing/baileys';
import { timeZoneConvert } from "./azanNotification";
import { getOptions, setOptions } from "./option";

export default function AlarmNotifications(socket :WASocket) {
  setInterval(() => {
    const timeNow = new Date();
    timeNow.setMilliseconds(0);
    const alarm = getOptions().alarm;
    const keys = new Map<
      string,
      { pesan: string; timeZone: number; waktu: number }
    >(Object.entries(alarm));
    keys.forEach((el, key, map) => {
        const convTimeZone = timeZoneConvert(timeNow, el.timeZone)
        if(convTimeZone.getTime() == el.waktu) {
          console.log("Dapat")
          socket.sendMessage(key, {text : `Alarm!!\n\n${el.pesan}`})
          map.delete(key)
          const newMap = Object.fromEntries(map)
          setOptions(newMap, "alarm")
        }
    });
  }, 1000);
}
