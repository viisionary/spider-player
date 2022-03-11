import React from "react";
import { ThemeContext, PlayerApiContext } from "../context";
import { drm, nodrm } from "../config.json";
import { toNumber, isNaN } from "lodash";

const useTheme = () => {
  const { theme } = React.useContext(ThemeContext);
  return theme;
};

const usePlayerApi = () => {
  const api = React.useContext(PlayerApiContext);
  return api;
};

const usePlayerConfig = () => {
  const [config, setConfig] = React.useState(nodrm?.data);
  return [config, setConfig];
};

const toNum = (value) => {
  if (typeof value !== "string") return value;
  if (value && !isNaN(toNumber(value))) return toNumber(value);
  return value;
};

const useFeatures = () => {
  const [config] = usePlayerConfig();

  const features = config?.config?.skin_data?.base;
  return Object.keys(features).reduce(
    (acc, key) => ({
      ...acc,
      [key]: toNum(features[key])
    }),
    {}
  );
};

export { useTheme, usePlayerConfig, useFeatures, usePlayerApi };
