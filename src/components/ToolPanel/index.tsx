import React from 'react';
import { observer } from "mobx-react-lite";
import state from "../../stores/state";
import { Slides } from "../Slides";
import { Daylight } from "../Daylight";
import { LayerList } from "../LayerList";

// Calcite Components imports
import "@esri/calcite-components/dist/components/calcite-shell-panel";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-block";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-input-number";
import "@esri/calcite-components/dist/components/calcite-select";
import "@esri/calcite-components/dist/components/calcite-option";
import "@esri/calcite-components/dist/components/calcite-switch";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-slider";

// Only allow valid calcite-shell-panel slots
type CalciteShellPanelSlot = "panel-start" | "panel-end";

interface ToolPanelProps {
  slot?: CalciteShellPanelSlot;
}

export const ToolPanel: React.FC<ToolPanelProps> = observer(({ slot = "panel-end" }) => {

  const handleTakeScreenshot = async () => {
    if (!state.sceneView) return;

    try {
      // Convert meters to inches (1 meter = 39.3701 inches)
      const heightInches = state.physicalHeightMeters * 39.3701;
      const widthInches = state.physicalWidthMeters * 39.3701;

      // Calculate pixel dimensions based on DPI
      const pixelWidth = Math.round(widthInches * state.sceneDpi);
      const pixelHeight = Math.round(heightInches * state.sceneDpi);

      const screenshot = await state.sceneView.takeScreenshot({
        width: pixelWidth,
        height: pixelHeight,
        format: "png"
      });

      // Create download link
      const element = document.createElement("a");
      const title = state.sceneView.map?.portalItem?.title || "screenshot";
      element.setAttribute("href", screenshot.dataUrl);
      element.setAttribute("download", `${title}_${pixelWidth}x${pixelHeight}_${state.sceneDpi}dpi.png`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  };

  return (
    <calcite-shell-panel
      slot={slot}
      position="end"
      id="shell-panel-end"
      displayMode="dock"
    >
      <calcite-panel heading="View Screenshot Configuration" id="panel-configure">
        <calcite-block
          heading="Print Export Settings"
          description="Configure print dimensions and quality (only for print, view in browser does not update)"
          open
        >
          <br></br>
          <calcite-label>
            Print Height (meters)
            <calcite-input-number
              value={`${state.physicalHeightMeters}`}
              oncalciteInputNumberChange={(e: any) => state.setPhysicalHeightMeters(Number(e.target.value))}
              min={0.01}
              step={0.01}
            ></calcite-input-number>
          </calcite-label>
          <br></br>
          <calcite-label>
            Print Width (meters)
            <calcite-input-number
              value={`${state.physicalWidthMeters}`}
              oncalciteInputNumberChange={(e: any) => state.setPhysicalWidthMeters(Number(e.target.value))}
              min={0.01}
              step={0.01}
            ></calcite-input-number>
          </calcite-label>
          <br></br>
          <calcite-label>
            DPI: {state.sceneDpi}
            <calcite-slider
              min={20}
              max={150}
              step={5}
              value={state.sceneDpi}
              oncalciteSliderInput={(e: any) => state.setSceneDpi(Number(e.target.value))}
            ></calcite-slider>
          </calcite-label>
          <br></br>
          <calcite-button
            width="full"
            onClick={handleTakeScreenshot}
            disabled={!state.viewLoaded}
          >
            Take Screenshot
          </calcite-button>        
          </calcite-block>
          <calcite-block
          heading="View Settings"
          description="Configure view size, elevation exaggeration, imagery saturation ground opacity and sky transparency"
          collapsible>
             <calcite-label>
            Height
            <calcite-input-number
              value={`${state.sceneHeight}`}
              oncalciteInputNumberChange={(e: any) => state.setSceneHeight(Number(e.target.value))}
              min={1}
              step={1}
            ></calcite-input-number>
          </calcite-label>
          <br></br>
          <calcite-label>
            Width
            <calcite-input-number
              value={`${state.sceneWidth}`}
              oncalciteInputNumberChange={(e: any) => state.setSceneWidth(Number(e.target.value))}
              min={1}
              step={1}
            ></calcite-input-number>
          </calcite-label>
          <br></br>
          <calcite-label>
            Elevation Exaggeration
            <calcite-switch
              checked={state.elevationExaggeration}
              oncalciteSwitchChange={(e: any) => state.setElevationExaggeration(e.target.checked)}
            ></calcite-switch>
          </calcite-label>
          <br></br>
          {state.elevationExaggeration && (
            <calcite-label>
              Exaggeration Factor: {state.elevationExaggerationFactor.toFixed(1)}
              <calcite-slider
                min={1}
                max={20}
                step={0.5}
                value={state.elevationExaggerationFactor}
                oncalciteSliderInput={(e: any) => state.setElevationExaggerationFactor(Number(e.target.value))}
              ></calcite-slider>
            </calcite-label>
          )}
          <br></br>
          <calcite-label>
            Saturated Imagery
            <calcite-switch
              checked={state.saturatedImagery}
              oncalciteSwitchChange={(e: any) => state.setSaturatedImagery(e.target.checked)}
            ></calcite-switch>
          </calcite-label>
          <br></br>
          {state.saturatedImagery && (
            <calcite-label>
              Saturation Factor: {state.saturationFactor.toFixed(1)}
              <calcite-slider
                min={0.5}
                max={3.0}
                step={0.1}
                value={state.saturationFactor}
                oncalciteSliderInput={(e: any) => state.setSaturationFactor(Number(e.target.value))}
              ></calcite-slider>
            </calcite-label>
          )}
          <br></br>
          <calcite-label>
            Ground Opacity: {state.groundOpacity.toFixed(2)}
            <calcite-slider
              min={0}
              max={1}
              step={0.05}
              value={state.groundOpacity}
              oncalciteSliderInput={(e: any) => state.setGroundOpacity(Number(e.target.value))}
            ></calcite-slider>
          </calcite-label>
          <br></br>
          <calcite-label>
            Transparent Background
            <calcite-switch
              checked={state.transparentBackground}
              oncalciteSwitchChange={(e: any) => state.setTransparentBackground(e.target.checked)}
            ></calcite-switch>
          </calcite-label>
          </calcite-block>

        <calcite-block
          heading="Daylight"
          description="Configure lighting and time of day"
          collapsible
        >
          <Daylight />
        </calcite-block>

        <calcite-block
          heading="Layers"
          description="Configure layers visibility and transparency"
          collapsible
        >
          <LayerList />
        </calcite-block>

        <calcite-block
          heading="Slides"
          description="Configure webscene slides"
          collapsible
        >
          <Slides />
        </calcite-block>
      </calcite-panel>
    </calcite-shell-panel>
  );
});