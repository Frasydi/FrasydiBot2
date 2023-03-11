import * as fs from "fs";
export default function duplicateName(
  dir: string,
  name: string,
  buffer: Buffer,
  ext : string
) {
  try {
    if (!fs.existsSync("media" + dir)) {
      fs.mkdirSync("media" + dir);
    }
    const files = fs.readdirSync("media" + dir);
    const existingFileNames = files.map((file) => file.split(".")[0]);
    let newFileName = name
    let i = 1;
    while (existingFileNames.includes(newFileName)) {
      newFileName = `${name}-${i}`;
      i += 1;
    }

    fs.writeFileSync(`media${dir}/${newFileName + "." + ext.split("/").at(-1)}`, buffer);
  } catch (err) {
    console.log(err);
  }
}
