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
    Use curly braces for properties (e.g. {width}, {codec_name}, {tags.language}, {channel_layout}) and type plain text directly.\n\
    Special: If you use {disposition.forced} in the format, it will add 'Forced' only if the stream is actually forced.\n\
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
        `Select which type of streams to rename.`,
    },
    {
      label: 'Video Rename Format',
      name: 'videoFormat',
      type: 'string',
      defaultValue: '{width}x{height} {display_aspect_ratio} ({codec_name})',
      inputUI: { type: 'text' },
      tooltip:
        `\
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
      defaultValue: '{tags.language} {channel_layout}',
      inputUI: { type: 'text' },
      tooltip:
        `\
        How should audio stream titles be renamed?\n\n\
        • Use curly braces for stream properties (e.g. {tags.language}, {channel_layout}, {codec_name}, {disposition.forced})\n\
        • Type plain text directly for fixed words or symbols: yapyap, ( ), etc.\n\
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
        `\
        How should subtitle stream titles be renamed?\n\n\
        • Use curly braces for stream properties (e.g. {tags.language}, {codec_name}, {disposition.forced})\n\
        • Type plain text directly for fixed words or symbols: yapyap, ( ), Forced, etc.\n\
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
function evaluateFormatString(format: string, stream: Record<string, unknown>): string {
  // Replace all {property} with their values
  return format.replace(/\{([^}]+)\}/g, (match, prop) => {
    if (prop === 'disposition.forced') {
      const forced = getNestedProperty(stream, 'disposition.forced');
      return (forced === 1 || forced === '1') ? 'Forced' : '';
    }
    const value = getNestedProperty(stream, prop);
    if (value == null) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[Tdarr Plugin] Warning: Property '{${prop}}' not found in stream object.`);
      }
      return '';
    }
    return String(value);
  }).replace(/\s+/g, ' ').trim();
}

// Helper function to get stream title based on type and format
const getStreamTitle = (streamCodecType: string, stream: Record<string, unknown>, streamType: string, formatMap: Record<string, string>): string => {
  if (streamType === 'all' || streamType === streamCodecType) {
    return evaluateFormatString(formatMap[streamCodecType], stream);
  }
  return '';
};

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  checkFfmpegCommandInit(args);

  const { streamType, videoFormat, audioFormat, subtitleFormat } = args.inputs;
  const formatMap: Record<string, string> = {
    video: String(videoFormat),
    audio: String(audioFormat),
    subtitle: String(subtitleFormat),
  };
  const { streams } = args.variables.ffmpegCommand;
  const metadataArgs: string[] = [];

  streams.forEach((stream: any) => {
    if (stream.removed) return;
    const streamCodecType = String(stream.codec_type);
    if (!["video", "audio", "subtitle"].includes(streamCodecType)) return;
    const title = getStreamTitle(streamCodecType, stream, String(streamType), formatMap);
    if (title) {
      metadataArgs.push(`-metadata:s:${stream.index}`);
      metadataArgs.push(`title=${title}`);
    }
  });

  args.variables.ffmpegCommand.overallOuputArguments.push(...metadataArgs);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export { details, plugin };