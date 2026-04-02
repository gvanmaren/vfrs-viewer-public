/* Copyright 2025 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let ExaggeratedElevationLayerClass: any = null;
let exaggeratedLayerInstance: any = null;
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import BaseElevationLayer from "@arcgis/core/layers/BaseElevationLayer";

export const createExaggeratedElevationLayer = async (exaggeration: number = 15) => {
  if (!ExaggeratedElevationLayerClass) {
    //@ts-ignore
    ExaggeratedElevationLayerClass = BaseElevationLayer.createSubclass({
      properties: {
        exaggeration: exaggeration,
      },

      load: function () {
        this._elevation = new ElevationLayer({
          url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
        });

        this.addResolvingPromise(
          this._elevation.load().then(() => {
            this.tileInfo = this._elevation.tileInfo;
            this.spatialReference = this._elevation.spatialReference;
            this.fullExtent = this._elevation.fullExtent;
          }),
        );

        return this;
      },

      fetchTile: function (level: number, row: number, col: number, options: any) {
        return this._elevation.fetchTile(level, row, col, options).then(
          function (data: any) {
            const exaggeration = this.exaggeration;
            for (let i = 0; i < data.values.length; i++) {
              data.values[i] = data.values[i] * exaggeration;
            }
            return data;
          }.bind(this),
        );
      },
    });
  }

  if (!exaggeratedLayerInstance) {
    exaggeratedLayerInstance = new ExaggeratedElevationLayerClass();
  }

  return exaggeratedLayerInstance;
};

export const enableElevationExaggeration = async (view: any) => {
  if (!view || !view.map) return;
  
  const elevationLayer = await createExaggeratedElevationLayer();
  view.map.ground = {
    layers: [elevationLayer],
  };
};

export const disableElevationExaggeration = (view: any) => {
  if (!view || !view.map) return;
  
  view.map.ground = "world-elevation";
};

export const updateExaggerationFactor = async (view: __esri.SceneView, exaggerationFactor: number) => {
// Recreate the layer from scratch with the new exaggeration factor
exaggeratedLayerInstance = null;
ExaggeratedElevationLayerClass = null;

const newElevationLayer = await createExaggeratedElevationLayer(exaggerationFactor);
view.map.ground = {
    layers: [newElevationLayer],
};
};
