import type { KeyboardEvent, KeyboardEventHandler } from "react";

declare namespace Fields {
  declare namespace TextField {
    type textFieldProps = {
      placeholder: string;
      id: string;
      onSubmit?: KeyboardEventHandler<HTMLElement>;
      isMandatory?: boolean;
      classList?: string;
    };

    type textFieldBehaviourProps = {
      initialFieldValue?: string;
      textFieldElementRef: React.RefObject<HTMLInputElement | null>;
      isMandatory?: boolean;
      onSubmit?: KeyboardEventHandler<HTMLElement>;
    };

    type textFieldBehaviourResult = {
      fieldValue: string;
      updateFieldValue: (newValue: string) => void;
      fieldSubmitHandler: KeyboardEventHandler<HTMLElement>;
      highlightTextFieldError: (
        fieldElement: HTMLInputElement | HTMLTextAreaElement,
      ) => void;
    };
  }

  type FieldSubmissionHandlerProps = {
    event: KeyboardEvent<HTMLElement>;
    isMandatory?: boolean;
    fieldElementRef: React.RefObject<HTMLInputElement | null>;
    onSubmit?: KeyboardEventHandler<HTMLElement>;
  };
}

export = Fields;
export = Fields.TextField;
