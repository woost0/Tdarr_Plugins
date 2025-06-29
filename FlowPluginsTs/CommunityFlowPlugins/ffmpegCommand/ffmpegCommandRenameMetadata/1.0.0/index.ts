import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Rename Streams Metadata',
  description: 'Rename stream titles using ffmpeg -metadata based on user-defined format and stream info.',
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
        `\
        Select which type of streams to rename.\\n\\n\
        • "all" - Rename all streams in the file\\n\
        • "video" - Rename only video streams\\n\
        • "audio" - Rename only audio streams\\n\
        • "subtitle" - Rename only subtitle streams\\n\\n\
        This plugin lets you set the FFmpeg -metadata title for each stream type using a customizable format.\\n\
        You can use stream properties (e.g. width, codec_name, tags.language, channel_layout, disposition.forced) and quoted text.\\n\
        The format string is comma-separated. Each token is either a property (like tags.language) or a literal in single quotes (like 'x').\\n\
        Special: If you use 'disposition.forced' in the format, it will add 'Forced' only if the stream is actually forced.\\n\
        No spaces are needed in quoted text; spacing is handled automatically except for 'x', '(', and ')'.\\n\
        `,
    },
    {
      label: 'Video Rename Format',
      name: 'videoFormat',
      type: 'string',
      defaultValue: "width, 'x', height, '(', codec_name, ')'",
      inputUI: { type: 'text' },
      tooltip:
        `\
        How should video stream titles be renamed?\\n\\n\
        • Use stream properties (e.g. width, height, codec_name)\\n\
        • Use quoted text for fixed words or symbols: '(', ')', 'x', etc.\\n\
        • Commas separate each part; a space is automatically added between properties and literals, except for 'x' or brackets.\\n\
        • You do NOT need to add spaces inside your quoted text.\\n\\n\
        Examples:\\n\
        • width, 'x', height, '(', codec_name, ')'   →  1920x1080 (HEVC)\\n\
        • 'Video', index, '(', codec_name, ')'       →  Video 1 (H264)\\n\\n\
        You can use any stream property from ffprobe, e.g. tags.language, disposition.forced, etc.\\n\
        If you use disposition.forced, it will add 'Forced' only if the stream is forced.\\n\
        `,
    },
    {
      label: 'Audio Rename Format',
      name: 'audioFormat',
      type: 'string',
      defaultValue: "tags.language, channel_layout",
      inputUI: { type: 'text' },
      tooltip:
        `\
        How should audio stream titles be renamed?\\n\\n\
        • Use stream properties (e.g. tags.language, channel_layout, codec_name, disposition.forced)\\n\
        • Use quoted text for fixed words or symbols: '-', etc.\\n\
        • Commas separate each part; a space is automatically added between properties and literals, except for 'x' or brackets.\\n\
        • You do NOT need to add spaces inside your quoted text.\\n\\n\
        Examples:\\n\
        • tags.language, channel_layout   →  ENG STEREO\\n\
        • 'Audio', channel_layout         →  Audio STEREO\\n\
        • tags.language, '(', codec_name, ')'  →  ENG (AAC)\\n\
        • tags.language, channel_layout, disposition.forced  →  ENG STEREO Forced (if forced)\\n\\n\
        If you use disposition.forced, it will add 'Forced' only if the stream is forced.\\n\
        `,
    },
    {
      label: 'Subtitle Rename Format',
      name: 'subtitleFormat',
      type: 'string',
      defaultValue: "tags.language, '(', codec_name, ')', disposition.forced",
      inputUI: { type: 'text' },
      tooltip:
        `\
        How should subtitle stream titles be renamed?\\n\\n\
        • Use stream properties (e.g. tags.language, codec_name, disposition.forced)\\n\
        • Use quoted text for fixed words or symbols: '(', ')', 'Forced', etc.\\n\
        • Commas separate each part; a space is automatically added between properties and literals, except for 'x' or brackets.\\n\
        • You do NOT need to add spaces inside your quoted text.\\n\\n\
        Examples:\\n\
        • tags.language, '(', codec_name, ')'   →  ENG (PGS)\\n\
        • 'Subtitle', index, '(', codec_name, ')'  →  Subtitle 2 (SRT)\\n\
        • tags.language, '(', codec_name, ')', disposition.forced  →  ENG (PGS) Forced (if forced)\\n\\n\
        If you use disposition.forced, it will add the text 'Forced' only if the stream is forced.\\n\
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

// Evaluate a format string for a stream (comma-separated, supports single-quoted literals and property access)
function evaluateFormatString(format: string, stream: Record<string, unknown>): string {
  const parts = format.split(',').map((part) => part.trim()).filter(Boolean);
  let out = '';
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i];
    let val = '';

    if (p === 'disposition.forced') {
      const forced = getNestedProperty(stream, 'disposition.forced');
      if (forced === 1 || forced === '1') {
        val = 'Forced';
      } else {
        val = '';
      }
    } else if (p.startsWith("'") && p.endsWith("'")) {
      val = p.slice(1, -1);
    } else {
      const prop = getNestedProperty(stream, p);
      val = prop == null ? '' : String(prop).toUpperCase();
    }
    
    if (!val) continue;
    // Only add space if not joining 'x', '(', or ')'
    if (out) {
      const prev = out[out.length - 1];
      if (
        val === 'x' || prev === 'x' ||
        val === ')' || prev === '('
      ) {
        // no space
      } else {
        out += ' ';
      }
    }
    out += val;
  }
  return out.replace(/ +/g, ' ').trim();
}

// Helper function to get stream title based on type and format
function getStreamTitle(
  type: string,
  stream: Record<string, unknown>,
  streamType: string,
  videoFormat: string,
  audioFormat: string,
  subtitleFormat: string
): string {
  switch (type) {
    case 'video':
      if (streamType === 'video' || streamType === 'all') {
        return evaluateFormatString(videoFormat, stream);
      }
      break;
    case 'audio':
      if (streamType === 'audio' || streamType === 'all') {
        return evaluateFormatString(audioFormat, stream);
      }
      break;
    case 'subtitle':
      if (streamType === 'subtitle' || streamType === 'all') {
        return evaluateFormatString(subtitleFormat, stream);
      }
      break;
    default:
      return '';
  }
  return '';
}

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  checkFfmpegCommandInit(args);

  const streamType = String(args.inputs.streamType);
  const audioFormat = String(args.inputs.audioFormat);
  const videoFormat = String(args.inputs.videoFormat);
  const subtitleFormat = String(args.inputs.subtitleFormat);
  const { streams } = args.variables.ffmpegCommand;
  const metadataArgs: string[] = [];

  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];
    if ((stream as any).removed) continue;
    const type = (stream as any).codec_type;

    const title = getStreamTitle(
      type, 
      stream, 
      streamType, 
      videoFormat, 
      audioFormat, 
      subtitleFormat
    );

    if (title) {
      metadataArgs.push(`-metadata:s:${(stream as any).index}`);
      metadataArgs.push(`title=${title}`);
    }
  }

  args.variables.ffmpegCommand.overallOuputArguments.push(...metadataArgs);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export { details, plugin };