import React from "react";
import { getCapabilities } from "./utils/supports";
import { Player } from "./player";
import { MediatorService } from "./mediator";
import { StreamService, createSource } from "./streamService";
import { ThemeContext } from "./context";
import { usePlayerConfig } from "./hooks";
import { getAdFoxParameters } from "./advertisement/utils";

const THEME = {
  MORETV: "MORETV"
};

export const App = () => {
  const [source, set] = React.useState(null);
  const [config] = usePlayerConfig();

  React.useEffect(() => {
    getCapabilities().then((capabilities) => {
      const streamService = StreamService(
        config?.playlist?.items?.[0]?.streams,
        capabilities
      );

      const selectStream = () => {
        const stream = streamService.getStream();
        if (stream) {
          set(createSource(stream));
        }
      };

      MediatorService.on("change_stream", selectStream);
      selectStream();
    });
  }, [config]);

  // React.useEffect(() => {
  //   setTimeout(() => {
  //     MediatorService.emit("change_stream");
  //   }, 5000);
  // }, []);

  if (!source) return null;

  console.log("selected source - ", source);

  return (
    <ThemeContext.Provider value={{ theme: THEME.MORETV }}>
      <Player source={source} />
    </ThemeContext.Provider>
  );
};
