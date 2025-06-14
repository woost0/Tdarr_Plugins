"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
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
            tooltip: "\n        Select which type of streams to check.\\n\n        \n        \u2022 \"all\" - Check all streams in the file\\n\n        \u2022 \"video\" - Check only video streams\\n\n        \u2022 \"audio\" - Check only audio streams\\n\n        \u2022 \"subtitle\" - Check only subtitle streams\\n\n        \u2022 \"data\" - Check only data streams (metadata, timecode, etc.)\\n\n        \n        This helps you target specific stream types without having to check codec_type manually.\n        ",
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
            tooltip: 'Toggle whether to enable checking only audio streams with the specified audio channels',
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
            tooltip: 'Toggle whether to enable checking only streams with the specified language tag',
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
            tooltip: "\n        Input which language tag from streams to check.\\n\n        (comma-separated for multiple langs to check for)\\n\n        \n        Common examples:\\n\n        \u2022 \"eng\" - Check tags.language for English language tag\\n\n        \u2022 \"jpn\" - Check tags.language for Japanese language tag\\n\n        \u2022 \"eng,jpn\" - Check tags.language for English or Japanese language tag ('or' not 'and')\\n\n        \n        This allows you to check other properties of streams that contain the specified languages.\\n\n        (eg. When Stream=audio AND Language=eng then check property 'codec_name' for value 'aac')\n        ",
        },
        {
            label: 'Property To Check',
            name: 'propertyToCheck',
            type: 'string',
            defaultValue: 'codec_name',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        What characteristic of your media file do you want to check?\\n\n        \n        Common examples:\\n\n        \u2022 codec_name - What audio/video format is used (like aac, mp3, h264, etc.)\\n\n        \u2022 width - Video width in pixels\\n\n        \u2022 height - Video height in pixels\\n\n        \u2022 channels - Number of audio channels (2 for stereo, 6 for 5.1 surround, etc.)\\n\n        \u2022 sample_rate - Audio quality (like 44100, 48000)\\n\n        \u2022 bit_rate - Quality/file size (higher = better quality, larger file)\\n\n        \u2022 tags.language - Audio/subtitle language (like eng, spa, fre)\\n\n        \u2022 codec_type - Whether it's \"video\", \"audio\", or \"subtitle\"\\n\n        \n        Enter the exact property name you want to check.\n        ",
        },
        {
            label: 'Values To Match',
            name: 'valuesToMatch',
            type: 'string',
            defaultValue: 'aac',
            inputUI: {
                type: 'text',
            },
            tooltip: "\n        What values are you looking for? Separate multiple values with commas.\\n \n        \n        Examples based on what you're checking:\\n\n        \u2022 For audio formats: aac,mp3,ac3\\n\n        \u2022 For video formats: h264,h265,hevc\\n\n        \u2022 For languages: eng,spa,fre\\n\n        \u2022 For video sizes: 1920 (for width) or 1080 (for height)\\n\n        \u2022 For audio channels: 2,6,8\\n\n        \u2022 For stream types: audio,video,subtitle\\n \n        \n        The plugin will look for files that have any of these values.\n        ",
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
            tooltip: "\n        How should the plugin match your values?\\n \n        \n        \u2022 \"includes\" - Find files that HAVE any of your values\\n\n        Example: If checking for \"aac,mp3\" audio, files with aac OR mp3 will match\\n \n        \n        \u2022 \"not_includes\" - Find files that DON'T have any of your values\\n\n        Example: If checking for \"aac,mp3\" audio, only files with neither aac nor mp3 will match\\n \n        \n        \u2022 \"equals\" - Find files where the property exactly matches your values\\n\n        Example: If checking width for \"1920\", only files that are exactly 1920 pixels wide will match\\n \n        \n        \u2022 \"not_equals\" - Find files where the property doesn't exactly match any of your values\\n\n        Example: If checking width for \"1920\", files that are NOT exactly 1920 pixels wide will match\\n \n        \n        Most users want \"includes\" to find files that have what they're looking for.\n        ",
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
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var streamType = String(args.inputs.streamType);
    var enableChannel = Boolean(args.inputs.enableChannel);
    var audioChannelCount = Number(args.inputs.audioChannelCount);
    var enableLanguage = Boolean(args.inputs.enableLanguage);
    var languageTags = String(args.inputs.languageTag).trim().split(',').map(function (item) { return item.trim(); })
        .filter(function (row) { return row.length > 0; });
    var propertyToCheck = String(args.inputs.propertyToCheck).trim();
    var valuesToMatch = String(args.inputs.valuesToMatch).trim().split(',').map(function (item) { return item.trim(); })
        .filter(function (row) { return row.length > 0; });
    var condition = String(args.inputs.condition);
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
    var getNestedProperty = function (obj, path) {
        var parts = path.split('.');
        var current = obj;
        for (var i = 0; i < parts.length; i += 1) {
            var part = parts[i];
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    };
    // Helper function to check if a stream property matches the condition
    var checkStreamProperty = function (stream, index) {
        var target = getNestedProperty(stream, propertyToCheck);
        if (target === undefined || target === null) {
            return false;
        }
        var prop = String(target).toLowerCase();
        var matches = valuesToMatch.map(function (val) { return val.toLowerCase(); });
        switch (condition) {
            case 'includes':
                return matches.some(function (val) {
                    var match = prop.includes(val);
                    if (match) {
                        args.jobLog("Stream ".concat(index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" includes \"").concat(val, "\""));
                    }
                    return match;
                });
            case 'not_includes':
                var hasIncludes = matches.some(function (val) { return prop.includes(val); });
                if (hasIncludes) {
                    var matchedVal = matches.find(function (val) { return prop.includes(val); });
                    args.jobLog("Stream ".concat(index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" includes \"").concat(matchedVal, "\" - condition fails"));
                }
                return !hasIncludes;
            case 'equals':
                return matches.some(function (val) {
                    var match = prop === val;
                    if (match) {
                        args.jobLog("Stream ".concat(index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" equals \"").concat(val, "\""));
                    }
                    return match;
                });
            case 'not_equals':
                var hasEquals = matches.some(function (val) { return prop === val; });
                if (hasEquals) {
                    var matchedVal = matches.find(function (val) { return prop === val; });
                    args.jobLog("Stream ".concat(index, ": ").concat(propertyToCheck, " \"").concat(prop, "\" equals \"").concat(matchedVal, "\" - condition fails"));
                }
                return !hasEquals;
            default:
                return false;
        }
    };
    var hasMatchingProperty = false;
    // Check all streams in the file
    if ((_a = args.inputFileObj.ffProbeData) === null || _a === void 0 ? void 0 : _a.streams) {
        var streams = args.inputFileObj.ffProbeData.streams;
        // Filter streams by type if specified
        if (streamType !== 'all') {
            streams = streams.filter(function (stream) { return stream.codec_type === streamType; });
            if (streams.length === 0) {
                args.jobLog("No ".concat(streamType, " streams found in file"));
                return {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 2,
                    variables: args.variables,
                };
            }
        }
        // Filter audio streams by channel if specified
        if (enableChannel && streamType === 'audio') {
            streams = streams.filter(function (stream) { return stream.channels === audioChannelCount; });
            if (streams.length === 0) {
                args.jobLog("No ".concat(audioChannelCount, "ch audio streams found in file"));
                return {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 2,
                    variables: args.variables,
                };
            }
        }
        // Filter again by language when enabled
        if (enableLanguage) {
            streams = streams.filter(function (stream) {
                var _a, _b;
                var streamLanguage = ((_b = (_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                return languageTags
                    .map(function (val) { return val.toLowerCase(); })
                    .some(function (val) { return streamLanguage === val; });
            });
            if (streams.length === 0) {
                args.jobLog("No ".concat(languageTags.join(','), " streams found in file"));
                return {
                    outputFileObj: args.inputFileObj,
                    outputNumber: 2,
                    variables: args.variables,
                };
            }
        }
        // For negative conditions, ALL streams must pass; for positive conditions, ANY stream can pass
        var isNegativeCondition = condition === 'not_includes' || condition === 'not_equals';
        if (isNegativeCondition) {
            hasMatchingProperty = streams.every(function (stream, index) { return checkStreamProperty(stream, stream.index || index); });
        }
        else {
            hasMatchingProperty = streams.some(function (stream, index) { return checkStreamProperty(stream, stream.index || index); });
        }
    }
    var outputNumber = hasMatchingProperty ? 1 : 2;
    args.jobLog("File routed to output ".concat(outputNumber, " - ").concat(hasMatchingProperty ? 'has' : 'does not have', " ")
        + 'matching stream property');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNumber,
        variables: args.variables,
    };
};
exports.plugin = plugin;
