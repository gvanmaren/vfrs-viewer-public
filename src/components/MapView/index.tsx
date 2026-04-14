import React from "react";
import { observer } from "mobx-react-lite";
import { mapConfig } from "../../config";
import state from "../../stores/state";

import "@arcgis/map-components/components/arcgis-map";

interface MapViewProps {
  mapId?: string;
  hidden?: boolean;
}

export const MapView = observer(({ mapId = "main-map", hidden = false }: MapViewProps) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <arcgis-map
        id={mapId}
        item-id={mapConfig["web-map-id"]}
        
        onarcgisViewReadyChange={(event) => {
          const view = event.target.view;
          if (view?.constraints) {
            view.constraints.snapToZoom = false;
          }
          state.registerView("map", view);
          state.setViewLoadedById("map", true);
        }}
      ></arcgis-map>
    </div>
  );
});
