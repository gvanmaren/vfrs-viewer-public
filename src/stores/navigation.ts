import { action, makeObservable, observable } from "mobx";

export interface NavigationToggleState {
  assets: boolean;
  floors: boolean;
  bookmarks: boolean;
}

type NavigationToggleKey = keyof NavigationToggleState;

class NavigationState {
  toggles: NavigationToggleState = {
    assets: false,
    floors: false,
    bookmarks: false,
  };

  constructor() {
    makeObservable(this, {
      toggles: observable,
      toggle: action,
      setToggle: action,
      setToggles: action,
    });
  }

  toggle(key: NavigationToggleKey) {
    this.toggles = {
      ...this.toggles,
      [key]: !this.toggles[key],
    };
  }

  setToggle(key: NavigationToggleKey, value: boolean) {
    this.toggles = {
      ...this.toggles,
      [key]: value,
    };
  }

  setToggles(next: NavigationToggleState) {
    this.toggles = next;
  }
}

const navigationState = new NavigationState();

export type { NavigationToggleKey };
export default navigationState;
