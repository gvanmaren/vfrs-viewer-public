import React, { useEffect, useRef } from "react";

import "@esri/calcite-components/components/calcite-panel";
import "@arcgis/map-components/components/arcgis-layer-list";
import styles from "./AssetsPanel.module.css";

interface AssetsPanelProps {
  sceneId: string;
  slot?: string;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ sceneId, slot = "top-left" }) => {
  const layerListRef = useRef<any>(null);

  useEffect(() => {
    const layerList = layerListRef.current;
    if (!layerList) {
      return;
    }

    // Attach a legend panel to each LayerList item.
    layerList.listItemCreatedFunction = (event: any) => {
      const item = event?.item;
      if (!item) {
        return;
      }

      item.panel = {
        content: "legend",
      };
    };
  }, []);

  return (
    <div slot={slot} className={styles.container}>
      <calcite-panel className={styles.panel} heading="Assets">
        <div className={styles.listContainer}>
          <arcgis-layer-list
            ref={layerListRef}
            reference-element={sceneId}
          ></arcgis-layer-list>
        </div>
      </calcite-panel>
    </div>
  );
};
