import React from "react";
import { observer } from "mobx-react-lite";
import styles from "./InlineNavToggles.module.css";
import navigationState from "../../stores/navigation";

interface InlineNavTogglesProps {
  slot?: string;
}

export const InlineNavToggles: React.FC<InlineNavTogglesProps> = observer(({ slot = "content-center" }) => {
  const { toggles } = navigationState;

  return (
    <div slot={slot} className={styles.container}>
      <button
        type="button"
        className={`${styles.item} ${toggles.assets ? styles.selected : ""}`}
        onClick={() => navigationState.toggle("assets")}
        aria-pressed={toggles.assets}
      >
        ASSETS
      </button>
      <span className={styles.separator} aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={`${styles.item} ${toggles.floors ? styles.selected : ""}`}
        onClick={() => navigationState.toggle("floors")}
        aria-pressed={toggles.floors}
      >
        FLOORS
      </button>
      <span className={styles.separator} aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={`${styles.item} ${toggles.bookmarks ? styles.selected : ""}`}
        onClick={() => navigationState.toggle("bookmarks")}
        aria-pressed={toggles.bookmarks}
      >
        BOOKMARKS
      </button>
    </div>
  );
});
