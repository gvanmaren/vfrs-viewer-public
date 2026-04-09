import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import SliceAnalysis from "@arcgis/core/analysis/SliceAnalysis";
import SlicePlane from "@arcgis/core/analysis/SlicePlane";
import state from "../../stores/state";
import navigationState from "../../stores/navigation";
import { AssetsPanel } from "../AssetsPanel";
import { FloorPicker } from "../FloorPicker";
import styles from "./SceneToolsHost.module.css";

interface SceneToolsHostProps {
  sceneId?: string;
}

export const SceneToolsHost = observer(({ sceneId = "main-scene" }: SceneToolsHostProps) => {
  const excludedLayerTitles = ["Spexi Mesh (filtered)", "Shells (CBD)"];
  const sceneView = state.getView("scene");
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
    const setupSlice = async () => {
      const view = sceneView;
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
  }, [sceneView, navigationState.toggles.floors]);

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
      const view = sceneView;
      const sliceAnalysis = sliceAnalysisRef.current;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (view && sliceAnalysis && view.analyses.indexOf(sliceAnalysis) !== -1) {
        view.analyses.remove(sliceAnalysis);
      }
    };
  }, [sceneView]);

  if (!navigationState.toggles.assets && !navigationState.toggles.floors) {
    return null;
  }

  return (
    <div className={styles.container}>
      {navigationState.toggles.assets ? (
        <div className={styles.assets}>
          <AssetsPanel sceneId={sceneId}></AssetsPanel>
        </div>
      ) : null}

      {navigationState.toggles.floors ? (
        <div className={styles.floors}>
          <FloorPicker level={selectedLevel} onLevelChange={setSelectedLevel}></FloorPicker>
        </div>
      ) : null}
    </div>
  );
});
