import useFormSubmission from "../logic/useFormSubmission";
import TextField from "../../../common/components/TextField";
import UnifiedButton from "~/common/components/UnifiedButton";
import HomePageGreeting from "./HomePageGreeting";

export default function Homepage() {
  const { formSubmissionHandler } = useFormSubmission();
    return (
        <div
          className={`flex flex-col justify-center gap-4 h-full w-3/4 px-[2em] mx-auto my-auto`}
        >
         <HomePageGreeting />
          <div
            id="inputs-container"
            className="flex flex-col items-center w-full gap-3"
          >
            <TextField
              id={"username-field"}
              placeholder="Type your preferred username...."
              isMandatory={true}
              onSubmit={formSubmissionHandler}
              classList="w-full md:w-3/4"
            ></TextField>
            <UnifiedButton
              buttonLabel="Let's go ->"
              classList={"bg-gray-100"}
              onClick={formSubmissionHandler}
            ></UnifiedButton>
          </div>
        </div>
      );
}