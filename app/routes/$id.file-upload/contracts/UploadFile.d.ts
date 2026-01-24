import React from "react";

declare namespace UploadFile{
    type useFileUploadBehaviorResult = {
        handleFileUpload: React.ChangeEventHandler<HTMLInputElement>;
    }
}

export = UploadFile;