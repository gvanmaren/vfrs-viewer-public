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

export type MapConfig = {
  'web-map-id': string;
  basemap: string;
  center: {
    lon: number;
    lat: number;
  };
  popupDisabled: boolean;
  rotation: number;
  scale: number;
  zoom: number;
};

export const mapConfig = {
  'web-map-id': 'b6425184350f4c5fbfd156bcbde70bb9',
  'basemap': 'Streets',
  'center': {
    'lon': -118.2437,
    'lat': 34.0522,
  },
  'popupDisabled': false,
  'rotation': 0,
  'scale': 0,
  'zoom': 10,
};

export const portalUrl = 'https://3dgis.maps.arcgis.com/';

export const applicationTitle = "Vancouver Stadium";
export const applicationDescription = "Vancouver Fire Response Service";

export const applicationId = 'LTMUaLlOET1HAbbj';