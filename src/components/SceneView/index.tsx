import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { mapConfig } from "../../config";
import state from "../../stores/state";
import { getWebSceneIdFromHashParams, setWebSceneIdToHashParams } from "../../utils/URLHashParams";

import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-navigation-toggle";
import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-search";

interface SceneViewProps {
  sceneId?: string;
}

const VISIBLE_LAYER_TITLES = new Set([
  "BCplace - VFRS FireAsset Points"
]);

const normalizeLayerTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");

export const SceneView = observer(({ sceneId = "main-scene" }: SceneViewProps) => {
  const websceneId = getWebSceneIdFromHashParams() || mapConfig['web-scene-id'];

  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
    <arcgis-scene
      id={sceneId}
      item-id={websceneId}
      // alpha-compositing-enabled
      // style={{ height: `${state.sceneHeight}px`, width: `${state.sceneWidth}px`, background: "black"}}
      onarcgisViewReadyChange={(event) => {
      const view = event.target.view;
      state.registerView("scene", view);
      state.setViewLoadedById("scene", true);

      const visibleLayerTitles = new Set(
        Array.from(VISIBLE_LAYER_TITLES, normalizeLayerTitle),
      );

      // Keep only specific layers in the LayerList by hiding every other layer item.
      view.map?.allLayers?.forEach((layer: any) => {
        const layerTitle = typeof layer?.title === "string" ? layer.title : "";
        const normalizedTitle = normalizeLayerTitle(layerTitle);
        layer.listMode = visibleLayerTitles.has(normalizedTitle) ? "show" : "hide";
      });

      // view.popup = {
      //   dockEnabled: true,
      //   dockOptions: {
      //     position: "bottom-right",
      //     breakpoint: false
      //   }
      //   };
      
      // Update URL with current webscene ID if not already set
      // if (!getWebSceneIdFromHashParams()) {
      //   setWebSceneIdToHashParams(websceneId);
      // }
    }}
  >
  </arcgis-scene>
  </div>
  );
});