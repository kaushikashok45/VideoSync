import { EventHandler, useRef, useState } from "react";
import KeyboardKey from "~/routes/KeyboardKey";

type textFieldProps = {
    placeholder: string;
    id: string;
    onSubmit?: EventHandler<any>;
    isMandatory?: boolean;
    classList?: string;
};

export default function TextField({
    placeholder,
    id,
    onSubmit,
    isMandatory = false,
    classList = "",
}: textFieldProps) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const highlightFieldError = () => {
        if (inputRef.current) {
            inputRef.current.classList.add(
                "border-red-600",
                "border-2",
                "focus:outline-none"
            );
        }
    };

    const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();
        const eventTarget = event.target as HTMLInputElement;
        if (eventTarget.value === "" && isMandatory && event.key === "Enter") {
            console.log(event.key);
            highlightFieldError();
            return;
        }
        if (onSubmit && event.key === "Enter") {
            onSubmit(event);
        }
    };

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
                onKeyDown={handleSubmit}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                ref={inputRef}
            />
        </>
    );
}
