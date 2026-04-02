import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { mapConfig } from "../../config";
import state from "../../stores/state";
import navigationState from "../../stores/navigation";
import { getWebSceneIdFromHashParams, setWebSceneIdToHashParams } from "../../utils/URLHashParams";
import { AssetsPanel } from "../AssetsPanel";
import { FloorPicker } from "../FloorPicker";
import SliceAnalysis from "@arcgis/core/analysis/SliceAnalysis";
import SlicePlane from "@arcgis/core/analysis/SlicePlane";

import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-navigation-toggle";
import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-search";

interface SceneViewProps {
  sceneId?: string;
}

export const SceneView = observer(({ sceneId = "main-scene" }: SceneViewProps) => {
  const excludedLayerTitles = ["Spexi Mesh (filtered)", "Shells (CBD)"];
  const websceneId = getWebSceneIdFromHashParams() || mapConfig['web-map-id'];
  const searchRef = useRef<any>(null);
  const sliceAnalysisRef = useRef<SliceAnalysis | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const floorLevels = useMemo(
    () => [
      { level: 1, z: 8.03875895217061 },
      { level: 2, z: 12.999126647599041 },
      { level: 3, z: 17.81573011353612 },
      { level: 4, z: 24.563331766054034 },
    ],
    [],
  );

  const activeZ = useMemo(
    () => floorLevels.find((item) => item.level === selectedLevel)?.z ?? floorLevels[0].z,
    [floorLevels, selectedLevel],
  );
  const animatedZRef = useRef(activeZ);

  const createSlicePlane = (z: number) =>
    new SlicePlane({
      heading: 51.76797514952818,
      tilt: 0.00024752456693022395,
      width: 1000,
      height: 1000,
      position: {
        spatialReference: { latestWkid: 3857, wkid: 102100 },
        x: -13704727.873766169,
        y: 6321985.866549921,
        z,
      },
    });

  useEffect(() => {
    const configureSearchSource = async () => {
      if (!state.sceneView || !searchRef.current) {
        return;
      }

      const layer = state.sceneView.map?.allLayers?.find(
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
  }, [state.sceneView]);

  useEffect(() => {
    const setupSlice = async () => {
      const view = state.sceneView;
      if (!view) {
        return;
      }

      const sliceAnalysis =
        sliceAnalysisRef.current ??
        new SliceAnalysis({
          tiltEnabled: true,
          excludeGroundSurface: true,
          shape: createSlicePlane(animatedZRef.current),
        });

      sliceAnalysisRef.current = sliceAnalysis;
      sliceAnalysis.excludeGroundSurface = true;

      const excludedLayers =
        view.map?.allLayers
          ?.toArray()
          .filter((layer: any) => excludedLayerTitles.includes(layer?.title)) ?? [];

      sliceAnalysis.excludedLayers = excludedLayers;

      if (navigationState.toggles.floors) {
        if (view.analyses.indexOf(sliceAnalysis) === -1) {
          view.analyses.add(sliceAnalysis);
        }

        const analysisView = await view.whenAnalysisView(sliceAnalysis);
        analysisView.active = true;
      } else if (view.analyses.indexOf(sliceAnalysis) !== -1) {
        view.analyses.remove(sliceAnalysis);
      }
    };

    void setupSlice();
  }, [state.sceneView, navigationState.toggles.floors]);

  useEffect(() => {
    if (!navigationState.toggles.floors) {
      return;
    }

    const sliceAnalysis = sliceAnalysisRef.current;
    if (!sliceAnalysis) {
      return;
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startZ = animatedZRef.current;
    const endZ = activeZ;
    const duration = 640;

    if (Math.abs(endZ - startZ) < 0.0001) {
      sliceAnalysis.shape = createSlicePlane(endZ);
      animatedZRef.current = endZ;
      return;
    }

    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easeInOutCubic(rawProgress);
      const z = startZ + (endZ - startZ) * progress;

      sliceAnalysis.shape = createSlicePlane(z);
      animatedZRef.current = z;

      if (rawProgress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeZ, navigationState.toggles.floors]);

  useEffect(() => {
    return () => {
      const view = state.sceneView;
      const sliceAnalysis = sliceAnalysisRef.current;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (view && sliceAnalysis && view.analyses.indexOf(sliceAnalysis) !== -1) {
        view.analyses.remove(sliceAnalysis);
      }
    };
  }, []);
  
  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
    <arcgis-scene
      id={sceneId}
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
        <arcgis-search
      ref={searchRef}
      slot="top-right"
      reference-element={sceneId}
    ></arcgis-search>
    {navigationState.toggles.assets ? (
      <AssetsPanel sceneId={sceneId} slot="top-left"></AssetsPanel>
    ) : null}
    {navigationState.toggles.floors ? (
      <FloorPicker
        slot="top-right"
        level={selectedLevel}
        onLevelChange={setSelectedLevel}
      ></FloorPicker>
    ) : null}

  </arcgis-scene>
  </div>
  );
});