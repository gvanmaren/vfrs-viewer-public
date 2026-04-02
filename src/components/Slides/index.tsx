import React, { useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import state from "../../stores/state";

// Calcite Components imports
import "@esri/calcite-components/dist/components/calcite-list";
import "@esri/calcite-components/dist/components/calcite-list-item";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-button";
import Slide from "@arcgis/core/webscene/Slide";
import SunLighting from '@arcgis/core/views/3d/environment/SunLighting';

interface SlideData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  slide: any;
}

export const Slides: React.FC = observer(() => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');

  useEffect(() => {
    // Load existing slides from the webscene
    if (state.sceneView && state.sceneView.map?.presentation?.slides) {
      const sceneSlidesCollection = state.sceneView.map.presentation.slides;
      const slideDataArray: SlideData[] = [];
      
      sceneSlidesCollection.forEach((slide: any) => {
        slideDataArray.push({
          id: slide.id,
          title: slide.title.text,
          description: slide.environment.lighting.date.toLocaleString("en-GB", {
            timeZone: "UTC",
          }),
          thumbnailUrl: slide.thumbnail.url,
          slide: slide
        });
      });
      
      setSlides(slideDataArray);
    }
  }, [state.sceneView, state.viewLoaded]);

  const handleCreateSlide = async () => {
    if (!state.sceneView || !newSlideTitle.trim()) return;

    try {
      const slide = await Slide.createFrom(state.sceneView);
      slide.title.text = newSlideTitle;
      
      // Add to webscene slides collection
      state.sceneView.map.presentation.slides.add(slide);
      
      // Add to local state
      const newSlideData: SlideData = {
        id: slide.id,
        title: slide.title.text,
        description: (slide.environment.lighting as SunLighting).date.toLocaleString("en-GB", {
          timeZone: "UTC",
        }),
        thumbnailUrl: slide.thumbnail.url,
        slide: slide
      };
      
      setSlides([...slides, newSlideData]);
      setNewSlideTitle('');
    } catch (error) {
      console.error("Error creating slide:", error);
    }
  };

  const handleApplySlide = (slideData: SlideData) => {
    if (!state.sceneView) return;
    
    slideData.slide.applyTo(state.sceneView, {
      maxDuration: 3000,
      easing: "in-out-coast-cubic",
    });
  };

  const handleDeleteSlide = (slideData: SlideData) => {
    if (!state.sceneView) return;
    
    // Remove from webscene slides collection
    state.sceneView.map.presentation.slides.remove(slideData.slide);
    
    // Remove from local state
    setSlides(slides.filter(s => s.id !== slideData.id));
  };

  return (
    <>
      <calcite-list id="slidesDiv" label="slides" style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {slides.map((slideData) => (
          <calcite-list-item
            key={slideData.id}
            label={slideData.title}
            description={slideData.description}
            closable={true}
            oncalciteListItemSelect={() => handleApplySlide(slideData)}
            oncalciteListItemClose={() => handleDeleteSlide(slideData)}
          >
            <div slot="content-start" style={{ width: '80px', height: '60px' }}>
              <img 
                alt={slideData.title} 
                src={slideData.thumbnailUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </calcite-list-item>
        ))}
      </calcite-list>
      
      <calcite-label layout="inline" scale="s">
        Add slide:
        <calcite-input 
          id="createSlideTitleInput" 
          placeholder="Enter name" 
          scale="s"
          value={newSlideTitle}
          oncalciteInputInput={(e: any) => setNewSlideTitle(e.target.value)}
        >
          <calcite-button
            id="createSlideButton"
            slot="action"
            scale="s"
            kind="neutral"
            appearance="solid"
            onClick={handleCreateSlide}
            disabled={!state.viewLoaded || !newSlideTitle.trim()}
          >
            Create
          </calcite-button>
        </calcite-input>
      </calcite-label>
    </>
  );
});
