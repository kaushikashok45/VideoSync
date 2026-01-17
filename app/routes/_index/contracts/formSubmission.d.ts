import { Event } from "react";

declare namespace FormSubmission {
    type formSubmissionHookResult = {
        formSubmissionHandler: (event:Event<HTMLElement>) => void;
    }
}

export = FormSubmission;