const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const convertGifToMp4 = async (input : string, output : string) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .outputOptions([
          '-movflags faststart',
          '-pix_fmt yuv420p',
          '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'
        ])
        .toFormat('mp4')
        .on('end', () => {
          resolve('Conversion complete');
        })
        .on('error', (err : any) => {
          reject('Error occurred: ' + err.message);
        })
        .save(output);
    });
  };

export default convertGifToMp4