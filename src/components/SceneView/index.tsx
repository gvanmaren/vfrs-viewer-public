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
  "BCplace - VFRS FireAsset Points",
  "BCplace - egress routes",
  "BCplace - staircases",
  "BCplace - exits",
]);

const normalizeLayerTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");

export const SceneView = observer(({ sceneId = "main-scene" }: SceneViewProps) => {
  const websceneId = getWebSceneIdFromHashParams() || mapConfig['web-scene-id'];
  const sceneView = state.getView("scene");
  const searchRef = useRef<any>(null);

  useEffect(() => {
    const configureSearchSource = async () => {
      if (!sceneView || !searchRef.current) {
        return;
      }

      const layer = sceneView.map?.allLayers?.find(
        (item: any) => item?.title === "BC Place - VFRS - Fire Asset Points",
      );

      if (!layer) {
        return;
      }

      await layer.load();

      searchRef.current.includeDefaultSources = false;
      searchRef.current.sources = [
        {
          layer,
          searchFields: ["Fire_Assets", "OBJJECTID"],
          displayField: "Fire_Assets",
          outFields: ["*"],
          name: "Fire Assets",
          placeholder: "Search fire assets",
        },
      ];
    };

    void configureSearchSource();
  }, [sceneView]);

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
        console.log(layer.title, visibleLayerTitles.has(normalizedTitle));
        layer.listMode = visibleLayerTitles.has(normalizedTitle) ? "show" : "hide";
      });
      
      // Update URL with current webscene ID if not already set
      if (!getWebSceneIdFromHashParams()) {
        setWebSceneIdToHashParams(websceneId);
      }
    }}
  >
    <arcgis-search
      ref={searchRef}
      slot="top-right"
      reference-element={sceneId}
    ></arcgis-search>
  </arcgis-scene>
  </div>
  );
});