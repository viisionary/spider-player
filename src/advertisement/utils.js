import { v4 } from "uuid";
import { isSafari, isMobile } from "react-device-detect";

const AD_FOX_OWNER_ID = "264443";
export const ADV_DESKTOP_PLID = 229103;
export const ADV_OTHER_PLID = 229104;

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
    if (pair[0] && pair[1]) {
      result[pair[0]] = decodeURIComponent(pair[1]);
    }
  }

  return result;
};

export function getAdfoxQueryParameterForSafari() {
  const ADFOX_COOKIE_PARAMETER = "af_lpdid";
  const ADFOX_QUERY_PARAMETER = "extid";
  const ADFOX_ID_TAG = "extid_tag=adfox";

  const id = null; //getCookie(ADFOX_COOKIE_PARAMETER);

  return id ? `${ADFOX_ID_TAG}&${ADFOX_QUERY_PARAMETER}=${id}` : "";
}

const getAdFoxParameters = (link) => {
  const plid = isMobile ? ADV_OTHER_PLID : ADV_DESKTOP_PLID;
  const eid1 = v4();
  const blockId = "123123";
  const authorizedUserId = null;

  let formattedUrl = link;
  formattedUrl = formattedUrl.replace(/\${3}eid1\${3}/g, `${eid1}`);
  formattedUrl = formattedUrl.replace(/\${3}pr\${3}/g, `${blockId}`);
  formattedUrl = formattedUrl.replace(/\${3}plid\${3}/g, `${plid}`);
  const adfoxSafariQueryParam = isSafari
    ? getAdfoxQueryParameterForSafari()
    : "";
  formattedUrl = `${formattedUrl}&${adfoxSafariQueryParam}`;

  formattedUrl = `${formattedUrl}&eid6=${
    authorizedUserId || null
  }&eid7=${v4()}&eid8=${v4()}`;

  formattedUrl = formattedUrl.replace(/&+/g, "&").replace(/&+$/g, "");

  const adFoxParams = getQueryParams(formattedUrl);

  console.log(adFoxParams);
  return {
    ownerId: AD_FOX_OWNER_ID,
    params: { ...adFoxParams }
  };
};

export { getAdFoxParameters };
