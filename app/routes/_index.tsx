import TextField from "~/routes/TextField";
import { useNavigate } from "@remix-run/react";
import { useContext } from "react";
import UserNameContext from "~/routes/UserNameContext";
import { useLocation } from "@remix-run/react";
import { APP_NAME } from "../Constants";

export default function _Index() {
  const navigate = useNavigate();
  const { updateUserName } = useContext(UserNameContext);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  let inferredRoomId = params.get("roomId");
  if (!inferredRoomId) inferredRoomId = "videoSync";

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const eventTarget = event.target as HTMLInputElement;
    updateUserName(eventTarget.value);
    navigate(`/${inferredRoomId}/SetupScreen`);
  };

  return (
    <div className={`flex flex-col justify-center gap-3 h-full`}>
      <h2 className={`text-3xl`}>
        Welcome to{" "}
        <span className={`font-yesteryear text-4xl text-red-600`}>
          { APP_NAME}
        </span>
        .How should we call you?
      </h2>
      <TextField
        id={"username-field"}
        placeholder="Type your preferred username here...."
        isMandatory={true}
        onSubmit={handleSubmit}
      ></TextField>
    </div>
  );
}
