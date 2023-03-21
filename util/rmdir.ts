import * as fs from "fs";
export default function removeDir(path: string) {
  console.log(path);

  if (!fs.existsSync(path)) throw "Tidak menemukan dir";
  fs.readdirSync(path).forEach(function (file, index) {
    const curPath = path + "/" + file;
    if (fs.lstatSync(curPath).isDirectory()) {
      // recurse
      removeDir(curPath);
    } else {
      // delete file
      fs.unlinkSync(curPath);
    }
  });
    fs.rmdirSync(path);
  return;
}
