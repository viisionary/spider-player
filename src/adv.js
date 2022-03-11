import { v4 } from "uuid";
const AD_FOX_OWNER_ID = "264443";
export const ADV_DESKTOP_PLID = 229103;

export const parseUrl = (url) => {
  const link = document.createElement("a");
  link.href = url;

  return {
    protocol: link.protocol,
    host: link.host,
    hostname: link.hostname,
    port: link.port,
    pathname: link.pathname,
    hash: link.hash,
    search: link.search,
    origin: link.origin
  };
};

export const getQueryParams = (url) => {
  const { search: searchString } = parseUrl(url);

  const result = {};

  const query = searchString.substring(1);
  const vars = query.split("&");

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    result[pair[0]] = decodeURIComponent(pair[1]);
  }

  return result;
};

const getAdFoxParameters = (link) => {
  const plid = ADV_DESKTOP_PLID;
  const eid1 = v4();
  const blockId = "123123";

  let formattedUrl = link;
  formattedUrl = formattedUrl.replace(/\${3}eid1\${3}/g, `${eid1}`);
  formattedUrl = formattedUrl.replace(/\${3}pr\${3}/g, `${blockId}`);
  formattedUrl = formattedUrl.replace(/\${3}plid\${3}/g, `${plid}`);

  const adFoxParams = getQueryParams(formattedUrl);

  return {
    ownerId: AD_FOX_OWNER_ID,
    params: { ...adFoxParams }
  };
};

const Adv = () => {
  let _video = null;
  let _slot = null;
  let _preload = null;
  let _link = null;

  const reset = () => {
    console.log("reset");
    _preload = null;
    _link = null;
  };

  const init = (video, slot) => {
    _video = video;
    _slot = slot;
  };

  const preload = (link) =>
    new Promise((resolve, reject) => {
      if (!window.ya || !link) return;

      window.ya.videoAd
        .loadModule("AdLoader")
        .then(function (module) {
          return module.AdLoader.create({
            adFoxParameters: getAdFoxParameters(link)
          });
        })
        .then(function (adLoader) {
          return adLoader.loadAd();
        })
        .then(function (adViewer) {
          // return adViewer.showAd(video, slot);

          adViewer.preload({
            videoSlot: _video
          });

          _preload = adViewer;
          _link = link;

          console.log("PRELOAD SUCCESS");
          resolve(adViewer);
        })
        .catch((e) => {
          console.log("PRELOAD ERR", e);
          reject(e);
        });
    });

  const play = (link = _link) =>
    new Promise((resolve, reject) => {
      if (!window.ya) return;

      Promise.resolve()
        .then(() => (_preload ? _preload : preload(link)))
        .then(function (adViewer) {
          if (!adViewer) {
            return reject(new Error("adViewer is undefined"));
          }

          const adPlaybackController = adViewer.createPlaybackController(
            _video,
            _slot,
            {
              controlsSettings: {
                controlsVisibility: {
                  mute: false,
                  skip: false,
                  title: false,
                  adLabel: false,
                  timeline: false
                }
              }
            }
          );

          adPlaybackController.subscribe("AdPodError", (e) => {
            console.log("Ad error", e);
            reject(e);
          });

          adPlaybackController.subscribe("AdStarted", () => {
            console.log("Ad start playing");
          });

          adPlaybackController.subscribe("AdStopped", function () {
            console.log("Ad stopped playing");
            resolve();
          });

          adPlaybackController.playAd();
        })
        .catch(function (error) {
          console.error(error);
          reject(error);
        });
    });

  return { init, play, preload, reset };
};

const instanse = Adv();
export { instanse as Adv };

// const [isLoaded, setLoaded] = useState(false);
// const state = useRef({
//   preroll: {
//     is: false,
//     preload: false
//   },
//   midroll: {
//     is: false,
//     preload: false
//   },
//   postroll: {
//     is: false,
//     preload: false
//   }
// });

// useEffect(() => {
//   if (!isLoaded) return;

//   player?.current?.on("timeupdate", (data) => {
//     const {
//       currentTime = player.current.currentTime(),
//       duration = player.current.duration(),
//       remainingTime = player.current.remainingTime()
//     } = data;

//     console.log({ currentTime, duration, remainingTime });

//     const video = document.getElementById("video-player_html5_api");
//     const slot = document.getElementById(DEFAULT_ADV_CONTROLS_ID);
//     const link = config?.data?.config?.ad?.pre_roll?.items?.[0]?.item;

//     if (!video || !slot || !link) return;

//     // console.log('ADV INIT', video, slot, link);

//     if (
//       currentTime > 0 &&
//       currentTime < 10 &&
//       !state.current.preroll.preload
//     ) {
//       state.current.preroll.preload = true;
//       Adv.init(video, slot);
//       Adv.preload(link).catch((err) => {
//         state.current.preroll.preload = false;
//       });
//     }

//     if (currentTime > 10 && !state.current.preroll.is) {
//       state.current.preroll.is = true;
//       player.current.src({ src: fakeVideoSrc, type: "video/mp4" });
//       player.current.ready(() => {
//         Adv.play()
//           .then(() => {
//             player.current.src(source);
//             player.current.ready(() => {
//               player.current.play();
//             });
//           })
//           .catch((err) => console.log(err))
//           .finally(() => {
//             state.current.preroll.is = false;
//             state.current.preroll.preload = false;
//             Adv.reset();
//           });
//       });
//     }
//   });
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [isLoaded]);
