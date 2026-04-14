import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import SliceAnalysis from "@arcgis/core/analysis/SliceAnalysis";
import SlicePlane from "@arcgis/core/analysis/SlicePlane";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import state from "../../stores/state";
import navigationState from "../../stores/navigation";
import { AssetsPanel } from "../AssetsPanel";
import { FloorPicker } from "../FloorPicker";
import styles from "./SceneToolsHost.module.css";

interface SceneToolsHostProps {
  sceneId?: string;
}

export const SceneToolsHost = observer(({ sceneId = "main-scene" }: SceneToolsHostProps) => {
  const excludedLayerTitles = ["Spexi Mesh (filtered)", "Spexi Mesh", "Shells (CBD)"];
  const levelLookupUrl = "https://services6.arcgis.com/oQnbmhWcCuy4gMUa/arcgis/rest/services/Vancouver__BCplace_levels/FeatureServer/126";
  const sceneView = state.getView("scene");
  const mapView = state.getView("map");
  const sliceAnalysisRef = useRef<SliceAnalysis | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const filteredLayerViewsRef = useRef<Set<any>>(new Set());
  const managedFloorplanLayersRef = useRef<Set<any>>(new Set());
  const initialFloorplanVisibilityByLayerRef = useRef<Map<any, boolean>>(new Map());
  const levelIdsByNumberRef = useRef<Map<number, string[]>>(new Map());
  const levelNumberByIdRef = useRef<Map<string, number>>(new Map());
  const supportsLevelFieldByLayerRef = useRef<Map<any, boolean>>(new Map());
  const [levelLookupReady, setLevelLookupReady] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const floorLevels = useMemo(
    () => [
      { level: 1, z: 7 },
      { level: 2, z: 13 },
      { level: 3, z: 17.8 },
      { level: 4, z: 24.5 },
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

  const levelField = "LEVEL_ID";
  const levelNumberField = "LEVEL_NUMBER";

  const quoteSqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

  const buildSqlInClause = (fieldName: string, values: string[]) => {
    if (!values.length) {
      return "1=0";
    }

    return `${fieldName} IN (${values.map(quoteSqlString).join(",")})`;
  };

  const getActiveLevelIds = (currentLevel: number) => {
    return levelIdsByNumberRef.current.get(currentLevel) ?? [];
  };

  const getFloorplanLevelFromTitle = (title: string | undefined) => {
    if (!title) {
      return null;
    }

    const match = title.match(/^Floorplan level\s+(\d+)$/i);
    if (!match) {
      return null;
    }

    const level = Number(match[1]);
    return Number.isFinite(level) ? level : null;
  };


  const hasLevelField = async (layer: any) => {
    if (supportsLevelFieldByLayerRef.current.has(layer)) {
      return supportsLevelFieldByLayerRef.current.get(layer) === true;
    }

    try {
      await layer?.load?.();
      const fields = layer?.fields ?? [];
      const hasField = fields.some((field: any) => field?.name?.toUpperCase?.() === levelField);
      supportsLevelFieldByLayerRef.current.set(layer, hasField);
      return hasField;
    } catch {
      supportsLevelFieldByLayerRef.current.set(layer, false);
      return false;
    }
  };


  const setLayerViewFilter = async (view: any, layer: any, where: string | null) => {
    try {
      const layerView = await view.whenLayerView(layer);
      if (!("filter" in layerView)) {
        return;
      }

      layerView.filter = where ? { where } : null;

      if (where) {
        filteredLayerViewsRef.current.add(layerView);
      } else {
        filteredLayerViewsRef.current.delete(layerView);
      }
    } catch {
      // Skip layers that do not produce a usable LayerView in the current view.
    }
  };

  const restoreAllFilters = () => {
    for (const layerView of filteredLayerViewsRef.current) {
      try {
        if ("filter" in layerView) {
          layerView.filter = null;
        }
      } catch {
        // LayerView can become stale if its parent view/layer is destroyed.
      }
    }

    filteredLayerViewsRef.current.clear();

    for (const layer of managedFloorplanLayersRef.current) {
      try {
        const initialVisibility = initialFloorplanVisibilityByLayerRef.current.get(layer);
        if (typeof initialVisibility === "boolean" && "visible" in layer) {
          layer.visible = initialVisibility;
        }
      } catch {
        // Layer can become stale if parent map/view is destroyed.
      }
    }

    managedFloorplanLayersRef.current.clear();
    initialFloorplanVisibilityByLayerRef.current.clear();
  };

  const applyMapFloorplanVisibility = (view: any, currentLevel: number) => {
    const layers = view?.map?.allLayers?.toArray?.() ?? [];

    for (const layer of layers) {
      const floorplanLevel = getFloorplanLevelFromTitle(layer?.title);
      if (floorplanLevel === null || !("visible" in layer)) {
        continue;
      }

      if (!initialFloorplanVisibilityByLayerRef.current.has(layer)) {
        initialFloorplanVisibilityByLayerRef.current.set(layer, Boolean(layer.visible));
      }

      managedFloorplanLayersRef.current.add(layer);
      layer.visible = floorplanLevel === currentLevel;
    }
  };

  const applyFloorFilters = async (view: any, currentLevel: number) => {
    const activeLevelIds = getActiveLevelIds(currentLevel);

    const layers = view?.map?.allLayers?.toArray?.() ?? [];

    for (const layer of layers) {
      if (layer.title === 'BCplace - VFRS FireAsset Points') {
        await setLayerViewFilter(view, layer, `Floor_Level = 'Level ${currentLevel}'`);
        continue;
      }

      const supportsFloorFilter = await hasLevelField(layer);
      if (!supportsFloorFilter || ["BCplace - level1", "BCplace - level2", "BCplace - level3", "BCplace - level4"].includes(layer.title)) {
        await setLayerViewFilter(view, layer, null);
        continue;
      }

      const whereEquals = buildSqlInClause(levelField, activeLevelIds);
      await setLayerViewFilter(view, layer, whereEquals);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadLevelLookup = async () => {
      try {
        const lookupLayer = new FeatureLayer({
          url: levelLookupUrl,
        });

        const result = await lookupLayer.queryFeatures({
          where: "1=1",
          outFields: [levelField, levelNumberField],
          returnGeometry: false,
        });

        if (cancelled) {
          return;
        }

        const nextLevelIdsByNumber = new Map<number, string[]>();
        const nextLevelNumberById = new Map<string, number>();

        for (const feature of result.features ?? []) {
          const levelId = feature?.attributes?.[levelField];
          const levelNumber = Number(feature?.attributes?.[levelNumberField]);

          if (levelId === undefined || levelId === null || Number.isNaN(levelNumber)) {
            continue;
          }

          const normalizedLevelId = String(levelId);
          nextLevelNumberById.set(normalizedLevelId, levelNumber);

          const ids = nextLevelIdsByNumber.get(levelNumber) ?? [];
          ids.push(normalizedLevelId);
          nextLevelIdsByNumber.set(levelNumber, ids);
        }

        levelIdsByNumberRef.current = nextLevelIdsByNumber;
        levelNumberByIdRef.current = nextLevelNumberById;

      } catch {
        // If lookup fails, keep map empty so filters safely resolve to no matches.
        levelIdsByNumberRef.current = new Map();
        levelNumberByIdRef.current = new Map();
      } finally {
        if (!cancelled) {
          setLevelLookupReady(true);
        }
      }
    };

    void loadLevelLookup();

    return () => {
      cancelled = true;
    };
  }, []);

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

      restoreAllFilters();
    };
  }, [sceneView]);

  useEffect(() => {
    let cancelled = false;

    const runFiltering = async () => {
      if (!navigationState.toggles.floors) {
        restoreAllFilters();
        return;
      }

      if (mapView) {
        applyMapFloorplanVisibility(mapView, selectedLevel);
      }

      if (!levelLookupReady) {
        return;
      }

      if (!sceneView && !mapView) {
        return;
      }

      if (sceneView) {
        await applyFloorFilters(sceneView, selectedLevel);
      }

      if (mapView) {
        await applyFloorFilters(mapView, selectedLevel);
      }

      if (cancelled) {
        return;
      }
    };

    void runFiltering();

    return () => {
      cancelled = true;
    };
  }, [sceneView, mapView, selectedLevel, navigationState.toggles.floors, levelLookupReady]);

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
