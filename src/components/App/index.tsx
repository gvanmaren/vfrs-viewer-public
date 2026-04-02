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
import React from 'react';
import { observer } from 'mobx-react-lite';
import { ErrorAlert } from '../ErrorAlert';
import { Identity } from '../Identity';
import { SceneView } from '../SceneView'
import { Navigation } from '../Navigation';
import './App.css';

import "@esri/calcite-components/components/calcite-shell";

const sceneId = "main-scene";

const App = observer(function App() {
  return (
    <>
    <calcite-shell>
      <Navigation></Navigation>
      <div className="scene-container">
        <SceneView sceneId={sceneId}></SceneView>
      </div>
      <Identity></Identity>
      <ErrorAlert></ErrorAlert>
    </calcite-shell>  
    </>
  );
});

export default App;
