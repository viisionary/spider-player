import { PLAYER_ERROR } from "./utils";

export const handleWidevineSource = (licenseServerUrl) => {
  return {
    "com.widevine.alpha": {
      getLicense: (emeOptions, keyMessage, callback) => {
        const handleLicenseLoadError = (ev) => callback(ev);
        const handleLicenseLoadSuccess = (ev) => {
          const { response, status } = ev.target;

          if (status !== 200) {
            callback(PLAYER_ERROR.FETCH_LICENSE);
            return;
          }

          callback(null, response);
        };

        const xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";

        xhr.open("POST", licenseServerUrl, true);
        xhr.send(keyMessage);

        xhr.addEventListener("error", handleLicenseLoadError);
        xhr.addEventListener("load", handleLicenseLoadSuccess);
      }
    }
  };
};
