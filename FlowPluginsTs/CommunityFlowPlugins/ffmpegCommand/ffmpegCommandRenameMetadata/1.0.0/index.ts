import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Rename Streams Metadata',
  description:
    `
    Rename metadata titles for chosen stream to chosen format using FFmpeg -metadata.\n\
    Use curly braces for properties (e.g. {width}, {codec_name}, {tags.language}, {channel_layout})\n\
    Type plain text directly. (sees spaces)\n\
    Special: {disposition.forced} in the format will add 'Forced' if the stream is forced.\n\
    todo:\n\
    more special stuff for unique naming i guess (like {disposition.forced})\n\
    capitalize a property name inside the {} for output to also be caps.\n\
    megabits per second property somehow. in the format section {bit_rate}.\n\
    `,
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Stream Type to Rename',
      name: 'streamType',
      type: 'string',
      defaultValue: 'all',
      inputUI: {
        type: 'dropdown',
        options: [
          'all',
          'video',
          'audio',
          'subtitle',
        ],
      },
      tooltip:
        'Select which type of streams to rename.',
    },
    {
      label: 'Video Rename Format',
      name: 'videoFormat',
      type: 'string',
      defaultValue: '{width}x{height} {display_aspect_ratio} ({codec_name})',
      inputUI: { type: 'text' },
      tooltip:
        `
        How should video stream titles be renamed?\n\n\
        • Use curly braces for stream properties (e.g. {width}, {height}, {codec_name})\n\
        • Type plain text directly for fixed words or symbols: yapyap, ( ), etc.\n\
        Examples:\n\
        • {width}x{height} {display_aspect_ratio} ({codec_name})   →  1920x1080 16:9 (HEVC)\n\
        • Video {index} ({codec_name})      →  Video 1 (H264)\n\n\
        `,
    },
    {
      label: 'Audio Rename Format',
      name: 'audioFormat',
      type: 'string',
      defaultValue: '{tags.language} {channel_layout} ({codec_name})',
      inputUI: { type: 'text' },
      tooltip:
        `
        How should audio stream titles be renamed?\n\n\
        • Use curly braces for stream properties\n\
        • Type plain text directly for fixed words or symbols\n\
        Examples:\n\
        • {tags.language} {channel_layout}   →  ENG STEREO\n\
        • Audio {channel_layout}             →  Audio STEREO\n\
        • {tags.language} ({codec_name})     →  ENG (AAC)\n\
        • {tags.language} {channel_layout}   →  ENG STEREO\n\
        `,
    },
    {
      label: 'Subtitle Rename Format',
      name: 'subtitleFormat',
      type: 'string',
      defaultValue: '{tags.language} {disposition.forced} ({codec_name})',
      inputUI: { type: 'text' },
      tooltip:
        `
        How should subtitle stream titles be renamed?\n\n\
        • Use curly braces for stream properties\n\
        • Type plain text directly for fixed words or symbols\n\
        Examples:\n\
        • {tags.language} ({codec_name})   →  ENG (PGS)\n\
        • Subtitle {index} ({codec_name})  →  Subtitle 2 (SRT)\n\
        • {tags.language} {disposition.forced} ({codec_name})  →  ENG Forced (PGS)\n\n\
        If you use {disposition.forced}, it will add the text 'Forced' only if the stream is forced.\n\
        `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// Helper function to get nested property value
const getNestedProperty = (obj: Record<string, unknown>, path: string): unknown => {
  const parts = path.split('.');
  let current: unknown = obj;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
};

// Evaluate a format string for a stream using {PROPERTY} placeholders and plain text
const evaluateFormatString = (
  format: string,
  stream: Record<string, unknown>,
  args: IpluginInputArgs,
): string => format.replace(/\{([^}]+)\}/g, (_, prop) => {
  if (prop === 'disposition.forced') {
    const forced = getNestedProperty(stream, 'disposition.forced');
    return (forced === 1 || forced === '1') ? 'Forced' : '';
  }
  const value = getNestedProperty(stream, prop);
  if (value == null) {
    args.jobLog(`Warning: Property '{${prop}}' not found in stream object.`);
    return '';
  }
  return String(value);
}).replace(/\s+/g, ' ').trim();

// Helper function to get stream title based on type and format
const getStreamTitle = (
  streamCodecType: string,
  stream: Record<string, unknown>,
  streamType: string,
  formatMap: Record<string, string>,
  args: IpluginInputArgs,
): string => {
  if (streamType === 'all' || streamType === streamCodecType) {
    return evaluateFormatString(formatMap[streamCodecType], stream, args);
  }
  return '';
};

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  checkFfmpegCommandInit(args);

  const {
    streamType, videoFormat, audioFormat, subtitleFormat,
  } = args.inputs;
  const formatMap: Record<string, string> = {
    video: String(videoFormat),
    audio: String(audioFormat),
    subtitle: String(subtitleFormat),
  };
  const { streams } = args.variables.ffmpegCommand;
  const metadataArgs: string[] = [];

  streams.forEach((stream: Record<string, unknown>) => {
    if (stream.removed) return;
    const streamCodecType = String(stream.codec_type);
    if (!['video', 'audio', 'subtitle'].includes(streamCodecType)) {
      args.jobLog(`Stream: ${stream.index} (${streamCodecType}) skipped`);
      return;
    }
    const title = getStreamTitle(streamCodecType, stream, String(streamType), formatMap, args);
    if (title) {
      metadataArgs.push(`-metadata:s:${stream.index}`);
      metadataArgs.push(`title=${title}`);
      args.jobLog(`Stream: ${stream.index} (${streamCodecType}) renamed "${title}"`);
    }
  });

  args.variables.ffmpegCommand.overallOuputArguments.push(...metadataArgs);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
