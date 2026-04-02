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

import { action, makeObservable, observable } from "mobx";

export interface Error {
    name: string | null;
    message: string | null;
}

class State {
    viewLoaded: boolean = false
    error: Error = null
    sceneHeight: number = 600
    sceneWidth: number = 1800
    sceneDpi: number = 50
    physicalHeightMeters: number = 1.2
    physicalWidthMeters: number = 3.6
    sceneView: any = null
    elevationExaggeration: boolean = false
    elevationExaggerationFactor: number = 15.0
    saturatedImagery: boolean = false
    saturationFactor: number = 2.0
    groundOpacity: number = 1.0
    transparentBackground: boolean = false

    constructor() {
        makeObservable(this, {
            viewLoaded: observable,
            setViewLoaded: action,
            error: observable,
            setError: action,
            sceneHeight: observable,
            sceneWidth: observable,
            sceneDpi: observable,
            setSceneHeight: action,
            setSceneWidth: action,
            setSceneDpi: action,
            physicalHeightMeters: observable,
            physicalWidthMeters: observable,
            setPhysicalHeightMeters: action,
            setPhysicalWidthMeters: action,
            sceneView: observable,
            setSceneView: action,
            elevationExaggeration: observable,
            setElevationExaggeration: action,
            elevationExaggerationFactor: observable,
            setElevationExaggerationFactor: action,
            saturatedImagery: observable,
            setSaturatedImagery: action,
            saturationFactor: observable,
            setSaturationFactor: action,
            groundOpacity: observable,
            setGroundOpacity: action,
            transparentBackground: observable,
            setTransparentBackground: action
        })
    }

    setViewLoaded() {
        this.viewLoaded = true;
    }

    setError({ name, message }: Error) {
        if (name && message) {
            this.error = {
                name, message
            }
        } else {
            this.error = null;
        }

    }

    setSceneHeight(height: number) {
        this.sceneHeight = height;
    }

    setSceneWidth(width: number) {
        this.sceneWidth = width;
    }

    setSceneDpi(dpi: number) {
        this.sceneDpi = dpi;
    }

    setPhysicalHeightMeters(height: number) {
        this.physicalHeightMeters = height;
    }

    setPhysicalWidthMeters(width: number) {
        this.physicalWidthMeters = width;
    }

    setSceneView(view: any) {
        this.sceneView = view;
    }

    setElevationExaggeration(enabled: boolean) {
        this.elevationExaggeration = enabled;
    }

    setElevationExaggerationFactor(factor: number) {
        this.elevationExaggerationFactor = factor;
    }

    setSaturatedImagery(enabled: boolean) {
        this.saturatedImagery = enabled;
    }

    setSaturationFactor(factor: number) {
        this.saturationFactor = factor;
    }

    setGroundOpacity(opacity: number) {
        this.groundOpacity = opacity;
    }

    setTransparentBackground(enabled: boolean) {
        this.transparentBackground = enabled;
    }

}

const state = new State();
export default state;