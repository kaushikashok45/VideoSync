declare namespace Popover {
  type PopoverProps = {
    children: React.ReactNode;
    triggerElementRef: React.RefObject<HTMLElement | null>;
    classList?: string;
  };

  type usePopoverBehaviourParams = {
    triggerElementRef: React.RefObject<HTMLElement | null>;
    popoverElementRef: React.RefObject<HTMLElement | null>;
  };

  type usePopoverBehaviourResult = {
    isPopoverVisible: boolean;
  };
}
export = Popover;
