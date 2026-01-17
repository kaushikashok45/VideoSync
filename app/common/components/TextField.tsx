import { KeyboardEventHandler, useRef } from "react";
import type { TextField } from "../contracts/Fields";
import useTextFieldBehaviour from "../logic/useTextFieldBehaviour";

export default function TextField({
    placeholder,
    id,
    onSubmit,
    isMandatory = false,
    classList = "",
}: TextField.textFieldProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { fieldValue, updateFieldValue, fieldSubmitHandler } = useTextFieldBehaviour({ textFieldElement: inputRef.current as HTMLInputElement, isMandatory, onSubmit});

    return (
        <>
            <input
                type="text"
                id={id}
                className={`rounded-lg p-2 font-extrabold max-w-full
                  bg-[rgba(0,0,0,0.06)] backdrop-blur-sm border border-[rgba(0,0,0,0.1)]
                  focus:bg-[rgba(0,0,0,0.06)] focus:backdrop-blur-sm focus:border focus:border-[rgba(0,0,0,0.1)]
    dark:bg-white/10 dark:backdrop-blur-sm
    dark:border dark:border-white/20
    dark:text-white dark:placeholder:text-gray-400
    dark:focus:bg-white/10 dark:focus:backdrop-blur-sm
    dark:focus:border dark:focus:border-white/20
    dark:focus:text-white dark:focus:placeholder:text-gray-400
    focus:border-red-600 outline-none
 ${classList}`}
                placeholder={placeholder}
                onKeyDown={fieldSubmitHandler as KeyboardEventHandler<HTMLElement>}
                value={fieldValue}
                onChange={(event) => updateFieldValue(event.target.value)}
                ref={inputRef}
            />
        </>
    );
}
