import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Detailed Stream Property',
  description: 'Check your media files for specific audio/video characteristics (like audio codec, language, '
    + 'quality, etc.) and route them accordingly. This plugin checks the FFprobe stream data collected by Tdarr.',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Stream Type',
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
          'data',
        ],
      },
      tooltip:
        `
        Select which type of streams to check.\\n
        
        • "all" - Check all streams in the file\\n
        • "video" - Check only video streams\\n
        • "audio" - Check only audio streams\\n
        • "subtitle" - Check only subtitle streams\\n
        • "data" - Check only data streams (metadata, timecode, etc.)\\n
        
        This helps you target specific stream types without having to check codec_type manually.
        `,
    },
    {
      label: 'Enable audio channel check',
      name: 'enableChannel',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'streamType',
                  value: 'audio',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Toggle whether to enable checking only audio streams with the specified audio channels',
    },
    {
      label: 'Audio channel to check',
      name: 'audioChannelCount',
      type: 'number',
      defaultValue: '2',
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '3',
          '6',
          '8',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableChannel',
                  value: 'true',
                  condition: '===',
                },
                {
                  name: 'streamType',
                  value: 'audio',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify channel count to check for (disable channel check for all)',
    },
    {
      label: 'Enable Language check',
      name: 'enableLanguage',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable checking only streams with the specified language tag',
    },
    {
      label: 'Language to check',
      name: 'languageTag',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableLanguage',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        `
        Input which language tag from streams to check.\\n
        (comma-separated for multiple langs to check for)\\n
        
        Common examples:\\n
        • "eng" - Check tags.language for English language tag\\n
        • "jpn" - Check tags.language for Japanese language tag\\n
        • "eng,jpn" - Check tags.language for English or Japanese language tag ('or' not 'and')\\n
        
        This allows you to check other properties of streams that contain the specified languages.\\n
        (eg. When Stream=audio AND Language=eng then check property 'codec_name' for value 'aac')
        `,
    },
    {
      label: 'Property To Check',
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: 'codec_name',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        What characteristic of your media file do you want to check?\\n
        
        Common examples:\\n
        • codec_name - What audio/video format is used (like aac, mp3, h264, etc.)\\n
        • width - Video width in pixels\\n
        • height - Video height in pixels\\n
        • channels - Number of audio channels (2 for stereo, 6 for 5.1 surround, etc.)\\n
        • sample_rate - Audio quality (like 44100, 48000)\\n
        • bit_rate - Quality/file size (higher = better quality, larger file)\\n
        • tags.language - Audio/subtitle language (like eng, spa, fre)\\n
        • codec_type - Whether it's "video", "audio", or "subtitle"\\n
        
        Enter the exact property name you want to check.
        `,
    },
    {
      label: 'Values To Match',
      name: 'valuesToMatch',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        What values are you looking for? Separate multiple values with commas.\\n 
        
        Examples based on what you're checking:\\n
        • For audio formats: aac,mp3,ac3\\n
        • For video formats: h264,h265,hevc\\n
        • For languages: eng,spa,fre\\n
        • For video sizes: 1920 (for width) or 1080 (for height)\\n
        • For audio channels: 2,6,8\\n
        • For stream types: audio,video,subtitle\\n 
        
        The plugin will look for files that have any of these values.
        `,
    },
    {
      label: 'Condition',
      name: 'condition',
      type: 'string',
      defaultValue: 'includes',
      inputUI: {
        type: 'dropdown',
        options: [
          'includes',
          'not_includes',
          'equals',
          'not_equals',
        ],
      },
      tooltip: 
        `
        How should the plugin match your values?\\n 
        
        • "includes" - Find files that HAVE any of your values\\n
        Example: If checking for "aac,mp3" audio, files with aac OR mp3 will match\\n 
        
        • "not_includes" - Find files that DON'T have any of your values\\n
        Example: If checking for "aac,mp3" audio, only files with neither aac nor mp3 will match\\n 
        
        • "equals" - Find files where the property exactly matches your values\\n
        Example: If checking width for "1920", only files that are exactly 1920 pixels wide will match\\n 
        
        • "not_equals" - Find files where the property doesn't exactly match any of your values\\n
        Example: If checking width for "1920", files that are NOT exactly 1920 pixels wide will match\\n 
        
        Most users want "includes" to find files that have what they're looking for.
        `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has matching stream property',
    },
    {
      number: 2,
      tooltip: 'File does not have matching stream property',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  
  const streamType = String(args.inputs.streamType);

  const enableChannel = Boolean(args.inputs.enableChannel);
  const audioChannelCount = Number(args.inputs.audioChannelCount);

  const enableLanguage = Boolean(args.inputs.enableLanguage);
  const languageTags = String(args.inputs.languageTag).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);

  const propertyToCheck = String(args.inputs.propertyToCheck).trim();
  const valuesToMatch = String(args.inputs.valuesToMatch).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(args.inputs.condition);

  // Validation
  if (enableLanguage && languageTags.length === 0) {
    args.jobLog('Error: Language to check cannot be empty when Language check is enabled');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  if (!propertyToCheck) {
    args.jobLog('Error: Property to check cannot be empty');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  if (valuesToMatch.length === 0) {
    args.jobLog('Error: Values to match cannot be empty');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

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

  // Helper function to check if a stream property matches the condition
  const checkStreamProperty = (stream: Record<string, unknown>, index: number): boolean => {
    const target = getNestedProperty(stream, propertyToCheck);

    if (target === undefined || target === null) {
      return false;
    }

    const prop = String(target).toLowerCase();
    const matches = valuesToMatch.map((val) => val.toLowerCase());

    switch (condition) {
      case 'includes':
        return matches.some((val) => {
          const match = prop.includes(val);
          if (match) {
            args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" includes "${val}"`);
          }
          return match;
        });

      case 'not_includes':
        const hasIncludes = matches.some((val) => prop.includes(val));
        if (hasIncludes) {
          const matchedVal = matches.find((val) => prop.includes(val));
          args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" includes "${matchedVal}" - condition fails`);
        }
        return !hasIncludes;

      case 'equals':
        return matches.some((val) => {
          const match = prop === val;
          if (match) {
            args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" equals "${val}"`);
          }
          return match;
        });

      case 'not_equals':
        const hasEquals = matches.some((val) => prop === val);
        if (hasEquals) {
          const matchedVal = matches.find((val) => prop === val);
          args.jobLog(`Stream ${index}: ${propertyToCheck} "${prop}" equals "${matchedVal}" - condition fails`);
        }
        return !hasEquals;

      default:
        return false;
    }
  };

  let hasMatchingProperty = false;

  // Check all streams in the file
  if (args.inputFileObj.ffProbeData?.streams) {
    let { streams } = args.inputFileObj.ffProbeData;

    // Filter streams by type if specified
    if (streamType !== 'all') {
      streams = streams.filter((stream) => stream.codec_type === streamType);

      if (streams.length === 0) {
        args.jobLog(`No ${streamType} streams found in file`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 2,
          variables: args.variables,
        };
      }
    }
    // Filter audio streams by channel if specified
    if (enableChannel && streamType === 'audio') {
      streams = streams.filter((stream) => stream.channels === audioChannelCount);

      if (streams.length === 0) {
        args.jobLog(`No ${audioChannelCount}ch audio streams found in file`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 2,
          variables: args.variables,
        };
      }
    }
    // Filter again by language when enabled
    if (enableLanguage) {
      streams = streams.filter((stream) => {
        const streamLanguage = stream.tags?.language?.toLowerCase() || '';
        return languageTags
          .map((val) => val.toLowerCase())
          .some((val) => streamLanguage === val)
      });

      if (streams.length === 0) {
        args.jobLog(`No ${languageTags.join(',')} streams found in file`);
        return {
          outputFileObj: args.inputFileObj,
          outputNumber: 2,
          variables: args.variables,
        };
      }
      
    }

    // For negative conditions, ALL streams must pass; for positive conditions, ANY stream can pass
    const isNegativeCondition = condition === 'not_includes' || condition === 'not_equals';

    if (isNegativeCondition) {
      hasMatchingProperty = streams.every((stream, index) => checkStreamProperty(stream, stream.index || index));
    } else {
      hasMatchingProperty = streams.some((stream, index) => checkStreamProperty(stream, stream.index || index));
    }
  }

  const outputNumber = hasMatchingProperty ? 1 : 2;

  args.jobLog(
    `File routed to output ${outputNumber} - ${hasMatchingProperty ? 'has' : 'does not have'} `
    + 'matching stream property',
  );

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
