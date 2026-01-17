type Popup = {
  ref: React.Ref<HTMLElement>;
  closePopup: () => void;
};

class PopoverRegistry {
  private static instance: PopoverRegistry;
  private popups: Popup[];

  constructor() {
    this.popups = [];
  }

  static getInstance() {
    if (!PopoverRegistry.instance) {
      PopoverRegistry.instance = new PopoverRegistry();
    }
    return PopoverRegistry.instance;
  }

  registerPopup(newPopup: Popup) {
    this.popups.push(newPopup);
  }

  closeActivePopups() {
    this.popups.forEach((popup) => {
      popup.closePopup();
    });
    this.popups = [];
  }
}

export default PopoverRegistry.getInstance();
