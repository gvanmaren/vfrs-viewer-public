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

import BaseTileLayer from "@arcgis/core/layers/BaseTileLayer";
import esriRequest from "@arcgis/core/request";

let SaturatedImageryLayerClass: any = null;
let saturatedLayerInstance: any = null;

export const createSaturatedImageryLayer = async (saturationFactor: number = 2) => {
  if (!SaturatedImageryLayerClass) {
    //@ts-ignore
    SaturatedImageryLayerClass = BaseTileLayer.createSubclass({
      properties: {
        urlTemplate: null,
        saturation: saturationFactor,
      },

      getTileUrl: function (level: number, row: number, col: number) {
        return this.urlTemplate
          .replace("{z}", level)
          .replace("{x}", col)
          .replace("{y}", row);
      },

      fetchTile: function (level: number, row: number, col: number, options: any) {
        const url = this.getTileUrl(level, row, col);

        return esriRequest(url, {
          responseType: "image",
          signal: options && options.signal,
        }).then(
          function (response: any) {
            const image = response.data;
            const width = this.tileInfo.size[0];
            const height = this.tileInfo.size[0];

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;

            // Draw the image onto the canvas
            context.drawImage(image, 0, 0, width, height);

            // Get the image data to manipulate
            const imageData = context.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Apply saturation
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Convert to grayscale
              const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

              // Interpolate between grayscale and original based on saturation
              data[i] = gray + this.saturation * (r - gray);
              data[i + 1] = gray + this.saturation * (g - gray);
              data[i + 2] = gray + this.saturation * (b - gray);
            }

            // Put the modified image data back on the canvas
            context.putImageData(imageData, 0, 0);

            return canvas;
          }.bind(this),
        );
      },
    });
  }

  if (!saturatedLayerInstance) {
    saturatedLayerInstance = new SaturatedImageryLayerClass({
      urlTemplate: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      title: "Saturated World Imagery",
      copyright: "Esri, Maxar, Earthstar Geographics, and the GIS User Community"
    });
  }

  return saturatedLayerInstance;
};

export const enableSaturatedImagery = async (view: any) => {
  if (!view || !view.map) return;
  
  const layer = await createSaturatedImageryLayer();
  
  // Check if layer is already added
  if (!view.map.layers.includes(layer)) {
    view.map.layers.add(layer, 0); // Add at the bottom
  }
};

export const disableSaturatedImagery = async (view: any) => {
  if (!view || !view.map) return;
  
  if (saturatedLayerInstance && view.map.layers.includes(saturatedLayerInstance)) {
    view.map.layers.remove(saturatedLayerInstance);
  }
};

export const updateSaturationFactor = (saturationFactor: number) => {
  if (saturatedLayerInstance) {
    saturatedLayerInstance.saturation = saturationFactor;
    saturatedLayerInstance.refresh();
  }
};
