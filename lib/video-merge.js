import Helper from './helper.js';
import logUpdate from 'log-update';
import filesize from 'filesize';
import _ from 'lodash';

(() => {
  // Parse args
  const args = Helper.getArgs();
  if (args.files.length < 3) {
    Helper.invalidUsage('$ video-merge ./input1.mp4 ./input2.mp4 [..inputs] ./output.mp4');
  }

  let totalDuration = 0;
  let sizeOnDisk = 0;
  const ffmpeg = Helper.ffmpeg({
    progress: progress => {
      sizeOnDisk = progress.targetSize ? filesize(progress.targetSize * 1000, {unix: true}) : sizeOnDisk;
      const splitTime = _.map(progress.timemark.split(':'), _.toNumber);
      const elapsedTime = splitTime[0] * 3600 + splitTime[1] * 60 + _.round(splitTime[2]);
      const percent = _.ceil(elapsedTime * 100 / totalDuration);
      const update = [
        ` ${percent}%`,
        ` ${progress.timemark}`,
        ` ${progress.frames} frames (${progress.currentFps}/s)`,
        ` ${sizeOnDisk}`,
      ];
      logUpdate(update.join(' '));
    },
  });

  const totalFilesizePromise = [];
  const output = args.files.pop();
  _.each(args.files, file => {
    ffmpeg.input(file);
    totalFilesizePromise.push(Helper.getVideoDuration(file));
  });

  Promise.all(totalFilesizePromise)
    .then(_.sum)
    .then(durationSum => {
      totalDuration = durationSum;
      console.info(` Merging files to ${output}`);
      ffmpeg.mergeToFile(output, Helper.tmpDir());
    });
})();

