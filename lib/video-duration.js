import Helper from './helper.js';
import _ from 'lodash';

(() => {
  // Parse args
  const args = Helper.getArgs();
  if (args.files.length < 1) {
    Helper.invalidUsage('$ video-duration ./input1.mp4 ./input2.mp4 [..inputs]');
  }

  // Reading duration of one file
  if (args.files.length === 1) {
    Helper.getVideoDuration(args.files[0])
      .then(console.info);
    return;
  }

  // Reading duration of all files
  _.each(args.files, file => {
    Helper.getVideoDuration(file)
      .then(duration => {
        console.info(`${file}: ${duration}`);
      });
    return;
  });
})();

