declare namespace FormSubmission {
    type formSubmissionHookResult = {
        formSubmissionHandler: (event:Event) => void;
    }
}

export = FormSubmission;