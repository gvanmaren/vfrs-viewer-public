import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import state from "../../stores/state";

type SyncSource = "scene" | "map";

const SYNC_THROTTLE_MS = 16;
const CONTROL_RELEASE_DELAY_MS = 160;

export const ViewSync = observer(() => {
  const sceneView = state.getView("scene");
  const mapView = state.getView("map");
  const activeViewId = state.activeViewId;

  const isApplyingSyncRef = useRef(false);
  const lastSyncAtRef = useRef(0);
  const controllingSourceRef = useRef<SyncSource | null>(null);
  const releaseControlTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sceneView || !mapView) {
      return;
    }

    const clearReleaseTimer = () => {
      if (releaseControlTimerRef.current !== null) {
        window.clearTimeout(releaseControlTimerRef.current);
        releaseControlTimerRef.current = null;
      }
    };

    const setController = (source: SyncSource) => {
      clearReleaseTimer();
      controllingSourceRef.current = source;
    };

    const scheduleControlRelease = () => {
      clearReleaseTimer();
      releaseControlTimerRef.current = window.setTimeout(() => {
        controllingSourceRef.current = null;
        releaseControlTimerRef.current = null;
      }, CONTROL_RELEASE_DELAY_MS);
    };

    const applyViewpoint = async (source: any, target: any) => {
      if (!source || !target || isApplyingSyncRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastSyncAtRef.current < SYNC_THROTTLE_MS) {
        return;
      }

      const viewpoint = source.viewpoint?.clone?.();
      if (!viewpoint) {
        return;
      }

      isApplyingSyncRef.current = true;
      lastSyncAtRef.current = now;

      try {
        target.viewpoint = viewpoint;
      } catch {
        // Ignore view state errors during rapid interaction.
      } finally {
        window.requestAnimationFrame(() => {
          isApplyingSyncRef.current = false;
        });
      }
    };

    const syncFrom = (sourceId: SyncSource) => {
      const source = sourceId === "scene" ? sceneView : mapView;
      const target = sourceId === "scene" ? mapView : sceneView;

      const sourceIsActive = Boolean(source?.interacting || source?.animation);

      if (sourceIsActive) {
        setController(sourceId);
      }

      if (controllingSourceRef.current && controllingSourceRef.current !== sourceId) {
        return;
      }

      if (!sourceIsActive && controllingSourceRef.current !== sourceId) {
        return;
      }

      if (sourceId === "scene") {
        void applyViewpoint(sceneView, mapView);
      } else {
        void applyViewpoint(mapView, sceneView);
      }
    };

    const initialSource = activeViewId === "map" ? "map" : "scene";
    setController(initialSource);
    syncFrom(initialSource);

    const sceneHandle = sceneView.watch("viewpoint", () => {
      syncFrom("scene");
    });

    const mapHandle = mapView.watch("viewpoint", () => {
      syncFrom("map");
    });

    const sceneInteractingHandle = sceneView.watch("interacting", (isInteracting: boolean) => {
      if (isInteracting) {
        setController("scene");
        return;
      }

      if (!mapView.interacting && !sceneView.animation && !mapView.animation) {
        scheduleControlRelease();
      }
    });

    const mapInteractingHandle = mapView.watch("interacting", (isInteracting: boolean) => {
      if (isInteracting) {
        setController("map");
        return;
      }

      if (!sceneView.interacting && !sceneView.animation && !mapView.animation) {
        scheduleControlRelease();
      }
    });

    return () => {
      clearReleaseTimer();
      sceneHandle?.remove?.();
      mapHandle?.remove?.();
      sceneInteractingHandle?.remove?.();
      mapInteractingHandle?.remove?.();
    };
  }, [sceneView, mapView, activeViewId]);

  return null;
});
