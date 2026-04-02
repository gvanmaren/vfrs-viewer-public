import React, { useEffect, useRef } from 'react';
import { observer } from "mobx-react-lite";
import state from "../../stores/state";

import "@arcgis/map-components/components/arcgis-layer-list";

export const LayerList: React.FC = observer(() => {
  const layerListRef = useRef<any>(null);

  useEffect(() => {
    if (layerListRef.current && state.sceneView) {
      layerListRef.current.view = state.sceneView;
      
      // Add opacity slider to each layer item
      layerListRef.current.listItemCreatedFunction = (event: any) => {
        const item = event.item;
        
        if (item.layer && item.layer.opacity !== undefined) {
          // Create opacity slider container
          const sliderContainer = document.createElement("div");
          sliderContainer.style.padding = "8px 0";
          sliderContainer.style.display = "flex";
          sliderContainer.style.flexDirection = "column";
          sliderContainer.style.gap = "4px";
          
          // Create label
          const label = document.createElement("div");
          label.style.fontSize = "12px";
          label.style.color = "var(--calcite-ui-text-2)";
          label.textContent = `Opacity: ${Math.round(item.layer.opacity * 100)}%`;
          
          // Create slider
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = "0";
          slider.max = "100";
          slider.value = String(Math.round(item.layer.opacity * 100));
          slider.style.width = "100%";
          
          // Update opacity on slider change
          slider.addEventListener("input", (e: any) => {
            const opacity = Number(e.target.value) / 100;
            item.layer.opacity = opacity;
            label.textContent = `Opacity: ${e.target.value}%`;
          });
          
          sliderContainer.appendChild(label);
          sliderContainer.appendChild(slider);
          item.panel = {
            content: sliderContainer,
            className: "esri-icon-sliders-horizontal",
            icon: "transparency",
            title: "Opacity"
          };
        }
      };
    }
  }, [state.sceneView]);

  return (
    <arcgis-layer-list ref={layerListRef}></arcgis-layer-list>
  );
});
