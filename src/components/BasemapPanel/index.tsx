import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import state from "../../stores/state";
import styles from "./BasemapPanel.module.css";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-basemap-gallery";

interface BasemapPanelProps {
  sceneId?: string;
}

export const BasemapPanel: React.FC<BasemapPanelProps> = observer(({ sceneId = "main-scene" }) => {
  const mapView = state.getView("map");
  const galleryRef = useRef<any>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    let handle: any = null;

    const onReady = () => {
      const widget = el.widget;
      if (!widget) return;

      // When user picks a basemap in the gallery (which is linked to sceneView),
      // mirror the same selection onto the 2D map view.
      handle = reactiveUtils.watch(
        () => widget.activeBasemap,
        (activeBasemap: any) => {
          if (!activeBasemap || !mapView?.map) return;
          mapView.map.basemap =
            typeof activeBasemap.clone === "function"
              ? activeBasemap.clone()
              : activeBasemap;
        },
      );
    };

    el.addEventListener("arcgisReady", onReady);

    return () => {
      el.removeEventListener("arcgisReady", onReady);
      handle?.remove?.();
    };
  }, [mapView]);

  return (
    <div className={styles.container}>
      <calcite-panel className={styles.panel} heading="Basemap">
        <div className={styles.body}>
          <arcgis-basemap-gallery
            ref={galleryRef}
            reference-element={sceneId}
            className={styles.galleryContainer}
          ></arcgis-basemap-gallery>
        </div>
      </calcite-panel>
    </div>
  );
});
