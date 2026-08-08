declare namespace Button {
  type ButtonBehaviourProps = {
    buttonRef: React.RefObject<HTMLButtonElement | null>;
    onClick?: (e: MouseEvent) => void;
    onKeyPress?: (e: KeyboardEvent) => void;
  };

  type UnifiedButtonProps = {
    buttonLabel: string;
    classList?: string;
    onClick?: (e: MouseEvent) => void;
    onKeyPress?: (e: KeyboardEvent) => void;
  };
}

export = Button;
