import { entries } from "lodash";
import {
  handleFairplaySource,
  handlePlayreadySource,
  handleWidevineSource
} from "../utils/drm";

const STREAM_STATE = {
  NOT_SUPPORTED: "NOT_SUPPORTED",
  IN_PROCESS: "IN_PROCESS",
  NOT_USED: "NOT_USED"
};

export const StreamProtocol = {
  HLS: "HLS",
  DASH: "DASH",
  MSS: "MSS",
  MP4: "MP4"
};
export const DRM_TYPE = {
  FAIRPLAY: "fairplay",
  WIDEVINE: "widevine",
  PLAYREADY: "playready"
};

export const VIDEO_EXTENSION = {
  [StreamProtocol.HLS]: "application/x-mpegURL",
  [StreamProtocol.MP4]: "video/mp4",
  [StreamProtocol.DASH]: "application/dash+xml",
  [StreamProtocol.MSS]: "application/dash+xml"
};

export const PRIORITY_BY_PROTOCOL = [
  `${StreamProtocol.DASH}:${DRM_TYPE.WIDEVINE}`,
  `${StreamProtocol.HLS}:${DRM_TYPE.FAIRPLAY}`,
  `${StreamProtocol.DASH}:${DRM_TYPE.PLAYREADY}`,
  `${StreamProtocol.MSS}:${DRM_TYPE.PLAYREADY}`,
  StreamProtocol.HLS,
  StreamProtocol.DASH,
  StreamProtocol.MSS,
  StreamProtocol.MP4
];

export const isEncryptedStream = (s) => {
  return s.drm_type && s.ls_url;
};

export const StreamService = (
  sources = [],
  capabilities = [],
  streamHistoryKeys = []
) => {
  const streams = createSupportedStreamsList(sources, capabilities);
  const streamIterator = streamGenerator();

  console.log(streams, "STREAMS");

  function createKey({ drm_type, protocol }) {
    return drm_type ? `${protocol}:${drm_type}` : `${protocol}`;
  }

  function isSupported(stream) {
    const keys = isEncryptedStream(stream)
      ? [stream.drm_type, stream.protocol]
      : [stream.protocol];

    return keys.every((k) => capabilities.includes(k.toLowerCase()));
  }

  function createSupportedStreamsList(streams = [], capabilities) {
    const data = streams.reduce((acc, source) => {
      console.log(source, "source");
      const key = createKey(source);
      if (!isSupported(source, capabilities)) return acc;

      return {
        ...acc,
        [key]: source
      };
    }, {});

    const priorityList = [
      ...streamHistoryKeys,
      ...PRIORITY_BY_PROTOCOL.filter((k) => !streamHistoryKeys[k])
    ];

    return priorityList.reduce(
      (acc, key) => (data[key] ? { ...acc, [key]: data[key] } : acc),
      {}
    );
  }

  function* streamGenerator() {
    for (const [key, value] of entries(streams)) {
      yield value;
    }
  }

  return {
    getStream: () => streamIterator.next().value || null
  };
};

const keySystemsExtension = ({ drm_type, ls_url }) => {
  const DataMap = {
    [DRM_TYPE.WIDEVINE]: () => ({
      keySystems: handleWidevineSource(ls_url)
    }),
    [DRM_TYPE.FAIRPLAY]: () => ({
      keySystems: handleFairplaySource(ls_url)
    }),
    [DRM_TYPE.PLAYREADY]: () => ({
      keySystems: handlePlayreadySource(ls_url)
    })
  };

  return DataMap[drm_type]?.();
};

export const createSource = (stream, options = {}) => {
  const ext = isEncryptedStream(stream) ? keySystemsExtension(stream) : {};

  return {
    src: stream.url,
    type: VIDEO_EXTENSION[stream.protocol],
    ...ext,
    handleManifestRedirects: true,
    ...options
  };
};
