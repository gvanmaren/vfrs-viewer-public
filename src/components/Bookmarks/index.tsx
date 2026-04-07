import styles from './Slides.module.css';
import state from '../../stores/state';
import { FC, ReactNode, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import navigationState from '../../stores/navigation';
import Slide from '@arcgis/core/webscene/Slide';

interface Props {
  children?: ReactNode;
}

export const Bookmarks: FC<Props> = observer(() => {
  const { viewLoaded } = state;
  const [slides, setSlides] = useState<__esri.Collection<__esri.Slide>>();
  const [activeSlide, setActiveSlide] = useState<__esri.Slide | null>(null);
  const [, setSlidesVersion] = useState(0);

  useEffect(() => {
    if (viewLoaded) {
      const view = state.sceneView;
      const slides = view.map.presentation.slides;
      setSlides(slides);
    }
  }, [viewLoaded]);

  useEffect(() => {
    if (activeSlide && state.sceneView) {
        activeSlide.applyTo(state.sceneView);
    }
  }, [activeSlide]);

  const handleCreateSlide = async () => {
    if (!state.sceneView) return;

    const view = state.sceneView;
    const webScene = view.map as __esri.WebScene;
    const nextSlideNumber = (webScene.presentation?.slides?.length ?? 0) + 1;

    try {
      const newSlide = await Slide.createFrom(view);
      newSlide.title.text = `Bookmark ${nextSlideNumber}`;

      webScene.presentation.slides.add(newSlide);
      setSlides(webScene.presentation.slides);
      setActiveSlide(newSlide);
      setSlidesVersion((version) => version + 1);

      await webScene.save();
    } catch (error) {
      console.error('Unable to create/save slide.', error);
    }
  };

  return (
    <>
    {navigationState.toggles.bookmarks && 
      <div className={styles.slidesContainer}>
        {slides &&
          slides.length > 0 &&
          slides.map((slide) => (
            <div
              key={slide.id}
              id={slide.id}
              className={styles.slide}
              onClick={() => {
                setActiveSlide(slide);
              }}
            >
              <img
                src={slide.thumbnail.url}
                title={slide.title.text}
                className={`${styles.circleImage} ${activeSlide && activeSlide.id === slide.id ? styles.active : ''}`}
              ></img>
            </div>
          ))}
        <button
          type='button'
          className={styles.addSlideButton}
          onClick={handleCreateSlide}
          title='Create bookmark from current view'
          aria-label='Create bookmark from current view'
        >
          +
        </button>
      </div>
      }
    </>
  );
});