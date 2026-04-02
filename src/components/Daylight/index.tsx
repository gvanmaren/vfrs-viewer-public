import React, { useEffect, useRef } from 'react';
import { observer } from "mobx-react-lite";
import state from "../../stores/state";

import "@arcgis/map-components/components/arcgis-daylight";

export const Daylight: React.FC = observer(() => {
  const daylightRef = useRef<any>(null);

  useEffect(() => {
    if (daylightRef.current && state.sceneView) {
      daylightRef.current.view = state.sceneView;
    }
  }, [state.sceneView]);

  return (
    <arcgis-daylight ref={daylightRef}></arcgis-daylight>
  );
});
