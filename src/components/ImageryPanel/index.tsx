import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import type OrientedImageryLayer from "@arcgis/core/layers/OrientedImageryLayer";
import state from "../../stores/state";
import styles from "./ImageryPanel.module.css";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-oriented-imagery-viewer";

interface ImageryPanelProps {
  sceneId?: string;
}

const ORIENTED_IMAGERY_LAYER_TITLE = "Vancouver BCPlace OI demo wgs84";

const findOrientedImageryLayer = (view: any): OrientedImageryLayer | null => {
  const layers = view?.map?.allLayers?.toArray?.() ?? [];
  return (
    layers.find(
      (layer: any) => layer?.title === ORIENTED_IMAGERY_LAYER_TITLE,
    ) ?? null
  );
};

export const ImageryPanel: React.FC<ImageryPanelProps> = observer(({ sceneId = "main-scene" }) => {
  const sceneView = state.getView("scene");
  const sceneLoaded = state.viewLoadedById.scene;
  const viewerRef = useRef<HTMLArcgisOrientedImageryViewerElement | null>(null);
  const [layer, setLayer] = useState<OrientedImageryLayer | null>(null);

  useEffect(() => {
    if (!sceneLoaded || !sceneView) return;
    setLayer(findOrientedImageryLayer(sceneView));
  }, [sceneLoaded, sceneView]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    (viewer as any).layer = layer ?? null;
  }, [layer]);

  useEffect(() => {
    const viewer = viewerRef.current as any;
    if (!viewer) return;

    const hideTitle = () => {
      const widget = viewer.widget;
      if (widget?.visibleElements) {
        widget.visibleElements.title = false;
      }
    };

    hideTitle();
    viewer.addEventListener?.("arcgisReady", hideTitle);
    return () => {
      viewer.removeEventListener?.("arcgisReady", hideTitle);
    };
  }, []);

  return (
    <div className={styles.container}>
      <calcite-panel className={styles.panel} heading="Oriented Imagery">
        <div className={styles.body}>
          <arcgis-oriented-imagery-viewer
            ref={viewerRef}
            reference-element={sceneId}
            className={styles.orientedImagery}
          ></arcgis-oriented-imagery-viewer>
        </div>
      </calcite-panel>
    </div>
  );
});
