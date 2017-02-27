import Helper from './helper.js';
import path from 'path';
import _ from 'lodash';

(() => {
  // Parse args
  const args = Helper.getArgs();
  if (args.files.length < 1) {
    Helper.invalidUsage('$ video-fps ./input1.mp4 ./input2.mp4 [..inputs] [newFPS]');
  }

  // Reading fps of one file
  if (args.files.length === 1) {
    Helper.getVideoFPS(args.files[0])
      .then(console.info);
    return;
  }

  // Changing the fps of specified files
  const lastFile = _.last(args.files);
  if (lastFile.match(/^[0-9]*$/)) {
    const fps = _.toNumber(args.files.pop());
    _.each(args.files, file => {
      const output = Helper.tmpFile(path.extname(file));
      const ffmpeg = Helper.ffmpeg(file, {
        progress: true,
        end: () => {
          Helper.rename(output, file);
        },
      });

      ffmpeg
        .fps(fps)
        .output(output)
        .run();
    });
    return;
  }

  // Reading fps of all files
  _.each(args.files, file => {
    Helper.getVideoFPS(file)
      .then(fps => {
        console.info(`${file}: ${fps}`);
      });
    return;
  });
})();

