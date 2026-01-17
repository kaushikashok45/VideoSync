import { KeyboardEvent, useState } from "react";
import type { TextField, FieldSubmissionHandlerProps } from "../contracts/Fields";

export function highlightTextFieldError(fieldElement: HTMLInputElement | HTMLTextAreaElement) {
    if (fieldElement) {
            fieldElement.classList.add(
                "border-red-600",
                "border-2",
                "focus:outline-none"
            );
        }
}

export function handleSubmit({event, isMandatory, fieldElement, onSubmit}:FieldSubmissionHandlerProps) {
        event.stopPropagation();
        const eventTarget = event.target as HTMLInputElement;
        const eventKey = (event as KeyboardEvent).key;
        if (eventTarget.value === "" && isMandatory && eventKey === "Enter") {
            console.log(eventKey);
            highlightTextFieldError(fieldElement);
            return;
        }
        if (onSubmit && eventKey === "Enter") {
            onSubmit(event);
        }
}

export default function useTextFieldBehaviour({initialFieldValue, textFieldElement, isMandatory, onSubmit}:TextField.textFieldBehaviourProps):TextField.textFieldBehaviourResult {
    const [ fieldValue, setValue ] =  useState(initialFieldValue || "");
    const updateFieldValue = (newValue: string) => setValue(newValue);
    const fieldSubmitHandler = (event:KeyboardEvent<HTMLElement>)=>handleSubmit.call(null, { event, isMandatory, fieldElement: textFieldElement, onSubmit });
    return { fieldValue, updateFieldValue, fieldSubmitHandler, highlightTextFieldError };
}