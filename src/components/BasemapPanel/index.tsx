import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import type { ArcgisBasemapGalleryCustomEvent } from "@arcgis/map-components";
import state from "../../stores/state";
import styles from "./BasemapPanel.module.css";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import Basemap from "@arcgis/core/Basemap";

interface BasemapPanelProps {
  sceneId?: string;
}

export const BasemapPanel: React.FC<BasemapPanelProps> = observer(({ sceneId = "main-scene" }) => {
  const mapView = state.getView("map");
  const galleryRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<Basemap | null>(null);

  useEffect(() => {

    if (!activeBasemap || !mapView?.map) return;
    mapView.map.basemap =
      typeof activeBasemap.clone === "function"
        ? activeBasemap.clone()
        : activeBasemap;

  }, [mapView, activeBasemap]);

  const basemapPropertyChanged = (
    event: ArcgisBasemapGalleryCustomEvent<{ name: "activeBasemap" | "state" }>,
  ) => {
    if (event && event.detail && event.detail.name === 'activeBasemap') {
      if (galleryRef.current) {
        const activeBasemap = galleryRef.current.activeBasemap;
        setActiveBasemap(activeBasemap);
      }

    }
  };

  return (
    <div className={styles.container}>
      <calcite-panel className={styles.panel} heading="Basemap">
        <div className={styles.body}>
          <arcgis-basemap-gallery
            ref={galleryRef}
            reference-element={sceneId}
            className={styles.galleryContainer}
            onarcgisPropertyChange={basemapPropertyChanged}
          ></arcgis-basemap-gallery>
        </div>
      </calcite-panel>
    </div>
  );
});
