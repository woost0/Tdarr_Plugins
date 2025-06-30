import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRenameMetadata/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_2.json');

describe('ffmpegCommandRenameMetadata Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    const sampleFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;

    // Create mock ffmpegCommand with streams based on the sample file
    const mockStreams = sampleFile.ffProbeData.streams?.map((stream, index) => ({
      ...stream,
      removed: false,
      forceEncoding: false,
      inputArgs: [],
      outputArgs: [],
      mapArgs: ['-map', `0:${stream.index}`],
      typeIndex: index,
    })) || [];

    baseArgs = {
      inputs: {
        streamType: 'all',
        videoFormat: '{width}x{height} {display_aspect_ratio} ({codec_name})',
        audioFormat: '{tags.language} {channel_layout} ({codec_name})',
        subtitleFormat: '{tags.language} {disposition.forced} ({codec_name})',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: mockStreams,
          container: 'mkv',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: sampleFile,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('defaultValue tests all metadata renaming', () => {
    it('should rename video metadata correctly', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 0 (video) renamed "1918x1080 959:540 (h264)"');
    });

    it('Should rename audio metadata correctly', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 1 (audio) renamed "eng stereo (flac)"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 2 (audio) renamed "eng stereo (ac3)"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 3 (audio) renamed "eng stereo (eac3)"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 4 (audio) renamed "fre stereo (aac)"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 5 (audio) renamed "eng stereo (aac)"');
    });

    it('Should rename subtitle metadata correctly', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 6 (subtitle) renamed "fre (subrip)"');
    });

    it('Shouldnt do anything to attachment metadata', () => {
      // Create a mock scenario with attachment stream types
      const streamsWithAttachments = [
        {
          index: 7,
          codec_name: 'ttf',
          codec_long_name: 'TrueType font',
          codec_type: 'attachment',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          codec_tag_string: '[0][0][0][0]',
          codec_tag: '0x0000',
          r_frame_rate: '0/0',
          avg_frame_rate: '0/0',
          time_base: '1/90000',
          start_pts: -1260,
          start_time: '-0.014000',
          duration_ts: 138689190,
          duration: 1540.991000,
          extradata_size: 48508,
          disposition: {
            default: 0,
            dub: 0,
            original: 0,
            comment: 0,
            lyrics: 0,
            karaoke: 0,
            forced: 0,
            hearing_impaired: 0,
            visual_impaired: 0,
            clean_effects: 0,
            attached_pic: 0,
            timed_thumbnails: 0,
            non_diegetic: 0,
            captions: 0,
            descriptions: 0,
            metadata: 0,
            dependent: 0,
            still_image: 0,
          },
          tags: {
            filename: 'Openc.TTF',
            mimetype: 'application/x-truetype-font',
          },
        },
        {
          index: 8,
          codec_name: 'ttf',
          codec_long_name: 'TrueType font',
          codec_type: 'attachment',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          codec_tag_string: '[0][0][0][0]',
          codec_tag: '0x0000',
          r_frame_rate: '0/0',
          avg_frame_rate: '0/0',
          time_base: '1/90000',
          start_pts: -1260,
          start_time: '-0.014000',
          duration_ts: 138689190,
          duration: 1540.991000,
          extradata_size: 10057108,
          disposition: {
            default: 0,
            dub: 0,
            original: 0,
            comment: 0,
            lyrics: 0,
            karaoke: 0,
            forced: 0,
            hearing_impaired: 0,
            visual_impaired: 0,
            clean_effects: 0,
            attached_pic: 0,
            timed_thumbnails: 0,
            non_diegetic: 0,
            captions: 0,
            descriptions: 0,
            metadata: 0,
            dependent: 0,
            still_image: 0,
          },
          tags: {
            filename: 'msmincho.ttc',
            mimetype: 'application/x-truetype-font',
          },
        },
      ];
      baseArgs.variables.ffmpegCommand.streams = streamsWithAttachments;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 7 (attachment) skipped');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream: 8 (attachment) skipped');
    });
  });
});
