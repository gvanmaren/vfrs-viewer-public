import React from "react";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-layer-list";
import styles from "./AssetsPanel.module.css";

interface AssetsPanelProps {
  sceneId: string;
  slot?: string;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ sceneId, slot = "top-left" }) => (
  <div slot={slot} className={styles.container}>
    <calcite-panel className={styles.panel} heading="Assets">
      <div className={styles.listContainer}>
        <arcgis-layer-list reference-element={sceneId}></arcgis-layer-list>
      </div>
    </calcite-panel>
  </div>
);
