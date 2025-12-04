import TextField from "~/routes/TextField";
import { useNavigate } from "@remix-run/react";
import { useContext } from "react";
import UserNameContext from "~/routes/UserNameContext";
import { useLocation } from "@remix-run/react";
import { APP_NAME } from "~/Constants";
import UnifiedButton from "~/components/UnifiedButton";

export default function _Index() {
  const navigate = useNavigate();
  const { updateUserName } = useContext(UserNameContext);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  let inferredRoomId = params.get("roomId");
  if (!inferredRoomId) inferredRoomId = "videoSync";

  const handleSubmit = (event: Event) => {
    event.stopPropagation();
    const eventTarget = event.target as HTMLInputElement;
    updateUserName(eventTarget.value);
    navigate(`/${inferredRoomId}/SetupScreen`);
  };

  return (
    <div
      className={`flex flex-col justify-center gap-3 h-full w-3/4 px-[2em] mx-auto my-auto`}
    >
      <h2 className={`text-3xl`}>
        Welcome to{" "}
        <span className={`font-yesteryear text-4xl text-red-600`}>
          {APP_NAME}
        </span>
        .How should we call you?
      </h2>
      <div id="inputs-container" className="flex flex-wrap w-full gap-4">
        <TextField
          id={"username-field"}
          placeholder="Type your preferred username...."
          isMandatory={true}
          onSubmit={handleSubmit}
          classList="w-full md:w-3/4"
        ></TextField>
        <UnifiedButton
          buttonLabel="Let's go ->"
          onClick={handleSubmit}
        ></UnifiedButton>
      </div>
    </div>
  );
}
