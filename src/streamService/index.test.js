import { DRM_TYPE, StreamService, StreamProtocol } from "./index";
import { drm as drm_streams, nodrm as nodrm_streams } from "./mock.json";

describe("StreamService", () => {
  it("should select HLS if there is support", () => {
    const capabilities = ["hls", "dash", "widevine"];
    const streamService = StreamService(nodrm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(nodrm_streams[0][0]);
  });

  it("should select DASH if there is support", () => {
    const capabilities = ["dash", "widevine"];
    const streamService = StreamService(nodrm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(nodrm_streams[0][1]);
  });

  it("should be NULL if there is no support 1 (no drm)", () => {
    const capabilities = [];
    const streamService = StreamService(nodrm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(null);
  });

  it("should be NULL if there is no support 2 (drm)", () => {
    const capabilities = [];
    const streamService = StreamService(drm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(null);
  });

  it("should be NULL if there is no support 3 (drm)", () => {
    const capabilities = ["hls"];
    const streamService = StreamService(drm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(null);
  });

  it("should be an enumeration of streams with priority on HLS", () => {
    const capabilities = ["dash", "hls"];
    const resultProtocols = [StreamProtocol.HLS, StreamProtocol.DASH];

    const streamService = StreamService(nodrm_streams[0], capabilities);

    capabilities.forEach((_, i) => {
      const stream = streamService.getStream();
      expect(stream.protocol).toBe(resultProtocols[i]);
    });
  });

  it("should select DASH+WIDEVINE if there is support", () => {
    const capabilities = ["dash", "hls", "widevine"];
    const streamService = StreamService(drm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(drm_streams[0][0]);
  });

  it("should select HLS+FAIRPLAY if there is support", () => {
    const capabilities = ["dash", "hls", "fairplay"];
    const streamService = StreamService(drm_streams[0], capabilities);
    expect(streamService.getStream()).toBe(drm_streams[0][3]);
  });

  it("stream from history must be prioritized 1", () => {
    const capabilities = ["hls", "dash"];

    const streamService = StreamService(nodrm_streams[0], capabilities, [
      StreamProtocol.DASH
    ]);

    expect(streamService.getStream()).toBe(nodrm_streams[0][1]);
    expect(streamService.getStream()).toBe(nodrm_streams[0][0]);
    expect(streamService.getStream()).toBe(null);
  });

  it("stream from history must be prioritized 2", () => {
    const capabilities = ["hls", "dash"];

    const streamService = StreamService(nodrm_streams[0], capabilities, [
      `${StreamProtocol.DASH}:${DRM_TYPE.WIDEVINE}`
    ]);

    expect(streamService.getStream()).toBe(nodrm_streams[0][0]);
    expect(streamService.getStream()).toBe(nodrm_streams[0][1]);
    expect(streamService.getStream()).toBe(null);
  });

  it("stream from history must be prioritized 3", () => {
    const capabilities = ["hls", "dash", "fairplay", "widevine"];

    const streamService = StreamService(drm_streams[0], capabilities, [
      `${StreamProtocol.HLS}:${DRM_TYPE.FAIRPLAY}`
    ]);

    expect(streamService.getStream()).toBe(drm_streams[0][3]);
  });
});
