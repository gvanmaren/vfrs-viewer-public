import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { mapConfig } from "../../config";
import state from "../../stores/state";
import { getWebSceneIdFromHashParams, setWebSceneIdToHashParams } from "../../utils/URLHashParams";
import { enableElevationExaggeration, disableElevationExaggeration, updateExaggerationFactor } from "../../utils/elevationExaggeration";
import { enableSaturatedImagery, disableSaturatedImagery, updateSaturationFactor } from "../../utils/saturatedImageryLayer";

import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-navigation-toggle";
import "@arcgis/map-components/components/arcgis-compass";

export const SceneView = observer(() => {
  const websceneId = getWebSceneIdFromHashParams() || mapConfig['web-map-id'];
  
  useEffect(() => {
    if (state.sceneView) {
      if (state.elevationExaggeration) {
        enableElevationExaggeration(state.sceneView);
      } else {
        disableElevationExaggeration(state.sceneView);
      }
    }
  }, [state.elevationExaggeration, state.sceneView]);
  
  useEffect(() => {
    if (state.elevationExaggeration) {
      updateExaggerationFactor(state.sceneView, state.elevationExaggerationFactor);
    }
  }, [state.elevationExaggerationFactor, state.elevationExaggeration]);
  
  useEffect(() => {
    if (state.sceneView) {
      if (state.saturatedImagery) {
        enableSaturatedImagery(state.sceneView);
      } else {
        disableSaturatedImagery(state.sceneView);
      }
    }
  }, [state.saturatedImagery, state.sceneView]);
  
  useEffect(() => {
    if (state.saturatedImagery) {
      updateSaturationFactor(state.saturationFactor);
    }
  }, [state.saturationFactor, state.saturatedImagery]);
  
  useEffect(() => {
    if (state.sceneView && state.sceneView.map && state.sceneView.map.ground) {
      state.sceneView.map.ground.opacity = state.groundOpacity;
    }
  }, [state.groundOpacity, state.sceneView]);
  
  useEffect(() => {
    if (state.sceneView && state.sceneView.environment) {
      if (state.transparentBackground) {
        // Set transparent background
        state.sceneView.environment.background = {
          type: "color",
          color: [0, 0, 0, 0]
        };
        state.sceneView.environment.starsEnabled = false;
        state.sceneView.environment.atmosphereEnabled = false;
      } else {
        // Restore realistic sky
        state.sceneView.environment.background = {
          type: "color",
          color: [0, 0, 0, 1]
        };
        state.sceneView.environment.starsEnabled = true;
        state.sceneView.environment.atmosphereEnabled = true;
      }
    }
  }, [state.transparentBackground, state.sceneView]);
  
  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
    <arcgis-scene
      item-id={websceneId}
      // alpha-compositing-enabled
      // style={{ height: `${state.sceneHeight}px`, width: `${state.sceneWidth}px`, background: "black"}}
      onarcgisViewReadyChange={(event) => {
      state.setViewLoaded();

      const view = event.target.view;
      state.setSceneView(view);
      
      // Update URL with current webscene ID if not already set
      if (!getWebSceneIdFromHashParams()) {
        setWebSceneIdToHashParams(websceneId);
      }
    }}
  >
    <arcgis-zoom slot="top-left"></arcgis-zoom>
    <arcgis-compass slot="top-left"></arcgis-compass>
  </arcgis-scene>
  </div>
  );
});