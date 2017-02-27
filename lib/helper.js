import ProgressBar from 'progress';
import Promise from 'bluebird';
import cliArgs from 'command-line-args';
import ffmpeg from 'fluent-ffmpeg';
import mv from 'mv';
import mkdirp from 'mkdirp';
import osTmpDir from 'os-tmpdir';
import _ from 'lodash';

const Helper = {
  // Parse args into object
  getArgs(options) {
    options = options || [{
      name: 'files',
      type: String,
      multiple: true,
      defaultOption: true,
    }];
    return cliArgs(options);
  },

  ffmpeg(filepath, options = null) {
    // Only one arg, can either be a filepath or an option
    if (!options && !_.isString(filepath)) {
      options = filepath;
      filepath = null;
    }
    options = options || {};

    const command = filepath ? ffmpeg(filepath) : ffmpeg();
    // Adding progress bar
    if (options.progress && _.isBoolean(options.progress)) {
      const bar = new ProgressBar(`${filepath} [:bar] :percent`, {total: 100});
      let lastPercent = 0;
      command
        .on('progress', progressData => {
          const newPercent = _.ceil(progressData.percent);
          bar.tick(newPercent - lastPercent);
          lastPercent = newPercent;
        });
    }

    if (_.isFunction(options.end)) {
      command.on('end', options.end);
    }
    if (_.isFunction(options.progress)) {
      command.on('progress', options.progress);
    }

    return command;
  },

  tmpDir() {
    const tmpDir = `${osTmpDir()}/video/`;
    mkdirp.sync(tmpDir);
    return tmpDir;
  },

  tmpFile(suffix = null) {
    const randomName = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');
    return `${Helper.tmpDir()}${randomName}${suffix}`;
  },

  rename(input, output) {
    return Promise.promisify(mv)(input, output);
  },

  // Stop process with error message
  invalidUsage(message) {
    console.info('Usage:');
    console.info(message);
    process.exit(1);
  },

  // Return a promise with data about the passed file
  getData(filepath) {
    return Promise.promisify(ffmpeg.ffprobe)(filepath);
  },

  // Get an object representing the video stream
  getVideoStream(filepath) {
    return Helper.getData(filepath)
      // eslint-disable-next-line camelcase
      .then(data => _.find(data.streams, {codec_type: 'video'}));
  },

  // Get the video bitrate
  getVideoBitrate(filepath) {
    return Helper.getVideoStream(filepath)
      .then(data => _.round(data.bit_rate / 1000));
  },

  // Get the video duration, in seconds
  getVideoDuration(filepath) {
    return Helper.getVideoStream(filepath)
      .then(data => _.round(data.duration));
  },

  // Get the video FPS
  getVideoFPS(filepath) {
    return Helper.getVideoStream(filepath)
      .then(data => {
        const averageFPS = data.r_frame_rate;
        return _.toNumber(averageFPS.split('/')[0]);
      });
  },
};
export default Helper;
