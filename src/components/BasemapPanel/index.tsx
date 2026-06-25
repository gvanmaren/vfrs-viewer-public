import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import type { ArcgisBasemapGalleryCustomEvent } from "@arcgis/map-components";
import type Layer from "@arcgis/core/layers/Layer";
import state from "../../stores/state";
import styles from "./BasemapPanel.module.css";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import Basemap from "@arcgis/core/Basemap";
import SceneFilter from "@arcgis/core/layers/support/SceneFilter";
import SceneLayer from "@arcgis/core/layers/SceneLayer";

interface BasemapPanelProps {
  sceneId?: string;
}

export const BasemapPanel: React.FC<BasemapPanelProps> = observer(({ sceneId = "main-scene" }) => {
  const mapView = state.getView("map");
  const galleryRef = useRef<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<Basemap | null>(null);
  const basemapFilter = useRef<SceneFilter | null>(null);

  const isSceneLayer = (layer: Layer): layer is SceneLayer => layer instanceof SceneLayer;

  // I'm only getting the first layer that has a filter set on it.
  const setFirstReferenceLayerFilter = (basemap: Basemap) => {
    const layers = (basemap.referenceLayers.toArray?.() ?? []) as Array<{ filter?: SceneFilter | null }>;
    const firstFilter = layers.find((layer) => layer.filter)?.filter ?? null;
    basemapFilter.current = firstFilter;
  };

  useEffect(() => {

    if (activeBasemap) {
      activeBasemap.referenceLayers.forEach(layer => {
        if (isSceneLayer(layer)) {
          layer.filter = basemapFilter.current;
        }
      })
    }

    // when the basemap is 3D, it will throw some errors because it can't create views for the scenelayers in mapview.
    // I consider it's not worth investing time finding a solution for this, for the end user it shows up well, 2D only needs the vector tiles.
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

  const onReady = () => {
    if (galleryRef.current && galleryRef.current.activeBasemap) {
      const basemap = galleryRef.current.activeBasemap as Basemap;
      setFirstReferenceLayerFilter(basemap);
    }
  }

  return (
    <div className={styles.container}>
      <calcite-panel className={styles.panel} heading="Basemap">
        <div className={styles.body}>
          <arcgis-basemap-gallery
            ref={galleryRef}
            reference-element={sceneId}
            className={styles.galleryContainer}
            onarcgisPropertyChange={basemapPropertyChanged}
            onarcgisReady={onReady}
          ></arcgis-basemap-gallery>
        </div>
      </calcite-panel>
    </div>
  );
});
