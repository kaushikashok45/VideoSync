declare namespace Popover{
    type PopoverProps = {
      children: React.ReactNode;
      triggerElementRef: React.RefObject<HTMLElement>;
      classList?: string;
    };

    type usePopoverBehaviourParams = {
        triggerElement : HTMLElement;
        popoverElement : HTMLElement;
    };

    type usePopoverBehaviourResult = {
        isPopoverVisible: boolean;
    };
}
export = Popover;