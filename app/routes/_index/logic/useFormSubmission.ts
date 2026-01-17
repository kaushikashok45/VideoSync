import { useNavigate, useLocation } from "@remix-run/react";
import { SyntheticEvent, useContext } from "react";
import UserNameContext from "../../../context/UserName/UserNameContext";
import type { formSubmissionHookResult } from "~/routes/_index/contracts/formSubmission";

function useFormSubmission (): formSubmissionHookResult {
    const navigate = useNavigate();
  const { updateUserName } = useContext(UserNameContext);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  let inferredRoomId = params.get("roomId");
  if (!inferredRoomId) inferredRoomId = "videoSync";

  const handleSubmit = (event: SyntheticEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const eventTarget = event.target as HTMLInputElement;
    updateUserName(eventTarget.value);
    navigate(`/${inferredRoomId}/SetupScreen`);
  }  
  
  return { formSubmissionHandler: handleSubmit };
}

export default useFormSubmission;