import Helper from './helper.js';
import path from 'path';
import _ from 'lodash';

(() => {
  // Parse args
  const args = Helper.getArgs();
  if (args.files.length < 1) {
    Helper.invalidUsage('$ video-bitrate ./input1.mp4 ./input2.mp4 [..inputs] [newBitrate]');
  }

  // Reading bitrate of one file
  if (args.files.length === 1) {
    Helper.getVideoBitrate(args.files[0])
      .then(console.info);
    return;
  }

  // Changing the bitrate of specified files
  const lastFile = _.last(args.files);
  if (lastFile.match(/^[0-9]*$/)) {
    const bitrate = _.toNumber(args.files.pop());
    _.each(args.files, file => {
      const output = Helper.tmpFile(path.extname(file));
      const ffmpeg = Helper.ffmpeg(file, {
        progress: true,
        end: () => {
          Helper.rename(output, file);
        },
      });

      ffmpeg
        .videoBitrate(bitrate)
        .output(output)
        .run();
    });
    return;
  }

  // Reading bitrate of all files
  _.each(args.files, file => {
    Helper.getVideoBitrate(file)
      .then(bitrate => {
        console.info(`${file}: ${bitrate}`);
      });
    return;
  });
})();
