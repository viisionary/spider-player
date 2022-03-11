import React from "react";
import canAutoPlay from "can-autoplay";
import { isIOS, isSafari } from "react-device-detect";

import "videojs-contrib-eme";
import videojs from "video.js";
import { MediatorService } from "../mediator";
import { AdController } from "../advertisement";
import { Skin } from "../skin";
import { fakeVideoSrc } from "../fake";
import { PlayerApiContext } from "../context";

export const DEFAULT_PLAYER_ID = "video-player";

const PLAYER_ERROR = {
  MEDIA_ERR_CUSTOM: 0,
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
  MEDIA_ERR_ENCRYPTED: 5
};

const VIDEO_TYPE = {
  PLAIN: "PLAIN",
  AD: "AD"
};

const Player = ({ source }) => {
  const player = React.useRef(null);
  const isFirstLaunch = React.useRef(true);

  const [isLoaded, setLoaded] = React.useState(false);

  const prevTime = React.useRef(0);
  const lineSeriesData = React.useRef([]);

  const [videoNode, setVideoNode] = React.useState(false);

  const [state, setState] = React.useState({
    currentTime: 0,
    videoType: VIDEO_TYPE.PLAIN
  });

  const currentSource = React.useRef(source);

  const updateState = (newState) => {
    setState((prev) => ({
      ...prev,
      ...newState,
      paused: player.current.paused()
    }));
  };

  const setVideoRef = React.useCallback((node) => {
    setVideoNode(node);
  }, []);

  const play = React.useCallback(async (muted = false) => {
    if (!player.current) return;

    player.current.muted(muted);
    const promise = player.current.play();

    if (promise !== undefined) {
      try {
        await promise;
      } catch (e) {
        console.error(e);

        if (muted) {
          throw new Error("autoplay with mute is blocked: ", e.message);
        }

        await play(true);
      }
    }
  }, []);

  const pause = React.useCallback(async () => {
    if (!player.current.paused()) {
      player.current.pause();
    }
  }, []);

  const setSource = React.useCallback(
    (source) =>
      new Promise((resolve) => {
        player.current.src(source);
        player.current.ready(resolve);
      }),
    []
  );

  const resumePlainVideo = React.useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!player.current || !currentSource.current) {
          reject("player instance or source is undefined");
          return;
        }

        const playVideo = async () => {
          try {
            await play(true);
            setState((prev) => ({ ...prev, videoType: VIDEO_TYPE.PLAIN }));
          } catch (e) {
            console.error(e, "error play");
            // TODO SHOW PLAY BTN (autoplay is blocked)
          }
        };

        setSource(currentSource.current).then(() => {
          player.current.one("loadedmetadata", async () => {
            if (isIOS || isSafari) {
              // TODO прекрыть плеер черным экраном чтобы не видеть перемотку
              player.current.one("timeupdate", () => {
                player.current.currentTime(1000);
              });
            } else {
              player.current.currentTime(1000);
            }

            // player.current.currentTime(1000);

            // player.current.currentTime(1000);
            // await new Promise((res) => {
            //   setTimeout(res, 3000);
            // });

            playVideo().then(() => {
              player.current.currentTime(1500);
              resolve();
            });
            // setTimeout(() => {
            //   playVideo().then(resolve);
            // }, 5000);
          });
        });
      }),
    [play, setSource]
  );

  const seek = React.useCallback((value) => {
    if (!player.current) return;

    const time = player.current.currentTime();
    player.current.currentTime(time + value);
  }, []);

  const initializeAdvertisement = React.useCallback(
    () =>
      new Promise((resolve) => {
        pause();
        setSource({ src: fakeVideoSrc, type: "video/mp4" }).then(() => {
          updateState({ videoType: VIDEO_TYPE.AD });
          resolve();
        });
      }),
    [pause, setSource]
  );

  React.useEffect(() => {
    const playerInstance = videojs(DEFAULT_PLAYER_ID, {
      enableSourceset: true,
      preload: "metadata"
    });
    playerInstance.eme();

    playerInstance.on("play", () => {
      console.log("play");

      // console.log(
      //   playerInstance.tech(false).vhs.playlists,
      //   playerInstance.tech(false).vhs.playlists.master,
      //   playerInstance.tech(false).vhs.playlists.media()
      // );
    });

    playerInstance.one("timeupdate", (data) => {
      MediatorService.emit("started");
    });

    playerInstance.on("sourceset", (data) => {});

    playerInstance.on("timeupdate", (data) => {
      updateState({ currentTime: playerInstance.currentTime() });
      // console.log(playerInstance.tech(false).vhs.stats);
    });

    player.current = playerInstance;

    return () => {
      if (player.current) player.current.dispose();
    };
  }, []);

  React.useEffect(() => {
    currentSource.current = source;
    // resumePlainVideo();
  }, [source, resumePlainVideo]);

  React.useEffect(() => {
    if (!player.current) return;

    const errorHandler = (event) => {
      const error = player.current.error();

      console.error(error);
      if (state.videoType === VIDEO_TYPE.AD) return;

      if (
        [
          PLAYER_ERROR.MEDIA_ERR_DECODE,
          PLAYER_ERROR.MEDIA_ERR_SRC_NOT_SUPPORTED
        ].includes(error.code)
      ) {
        MediatorService.emit("change_stream");
      }
    };

    player.current.on("error", errorHandler);

    return () => {
      player.current.off("error", errorHandler);
    };
  }, [state.videoType]);

  console.log("PLAER UPDATE");

  const value = React.useMemo(
    () => ({ play, pause, resumePlainVideo, initializeAdvertisement }),
    [play, pause, resumePlainVideo, initializeAdvertisement]
  );

  return (
    <PlayerApiContext.Provider value={value}>
      {/* <canvas id="myChart" width="400" height="400"></canvas> */}
      <div>
        <button
          style={{ position: "absolute", zIndex: 10000 }}
          onClick={() => seek(30)}
        >
          SEEK +30
        </button>
        <button
          style={{ position: "absolute", zIndex: 10000, left: "100px" }}
          onClick={() => seek(-30)}
        >
          SEEK -30
        </button>
        <button
          style={{ position: "absolute", zIndex: 10000, left: "200px" }}
          onClick={() => {
            if (player.current.paused()) {
              play();
            } else {
              pause();
            }
          }}
        >
          TOGGLE
        </button>
        <button
          style={{ position: "absolute", zIndex: 10000, left: "300px" }}
          onClick={() => {
            // setSource(source).then(() => {
            //   player.current.currentTime(2000);
            //   play();
            // });
            resumePlainVideo();
          }}
        >
          SET SRC
        </button>

        <Skin>
          <video
            style={{ width: 400, height: 200 }}
            ref={setVideoRef}
            id={DEFAULT_PLAYER_ID}
            muted
            playsInline
            onError={(e) => console.log(e)}
          />
        </Skin>
        {videoNode && (
          <AdController
            paused={state.paused}
            videType={state.videoType}
            currentTime={state.currentTime}
            videoNode={videoNode}
          />
        )}
      </div>
    </PlayerApiContext.Provider>
  );
};

export { Player };

// React.useEffect(() => {
//   if (!player.current) return;
//   const vhs = player.current.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
//   if (!vhs) return;

//   const labels = ["asd"];

//   const chart = new Chart(document.getElementById("myChart"), {
//     type: "line",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "My First Dataset",
//           data: [65]
//         }
//       ]
//     }
//   });

//   player.current.on("timeupdate", () => {
//     const vhs = player.current.tech?.({ IWillNotUseThisInPlugins: true })
//       ?.vhs;

//     chart.data.datasets.push({ data: [vhs.bandwidth] });
//   });
// }, [isLoaded]);
