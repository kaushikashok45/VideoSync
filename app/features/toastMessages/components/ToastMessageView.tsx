import type { toastMessageProps } from "../contracts/toastMessage";

export default function ToastMessageView({
  message,
  userName,
  icon,
}: toastMessageProps) {
  return (
    <div
      className={`font-overpass flex flex-row p-2 justify-content items-center gap-2`}
    >
      <p
        className={
          "text-sm h-15 w-10 max-h-15 max-w-10 p-3 border rounded-full border-gray-600 bg-white text-black flex justify-center items-center text-nowrap"
        }
      >
        {icon as React.ReactNode}
      </p>
      <p>
        <span className={`font-yesteryear text-2xl text-red-600`}>
          {userName}
        </span>{" "}
        {message}.
      </p>
    </div>
  );
}
