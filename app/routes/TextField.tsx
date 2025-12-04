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
        className={`shadow-white border rounded-lg p-2 font-extrabold max-w-full ${classList}`}
        placeholder={placeholder}
        style={{ backgroundColor: "white", color: "black" }}
        onKeyDown={handleSubmit}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        ref={inputRef}
      />
    </>
  );
}
