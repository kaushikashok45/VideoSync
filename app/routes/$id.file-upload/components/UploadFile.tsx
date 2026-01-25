import useFileUploadBehaviour from "../logic/useFileUploadBehaviour";

export default function UploadFile(){

    const { handleFileUpload: handleChange } = useFileUploadBehaviour();

    return (
    <div className="flex flex-col h-full w-full md:w-1/2 justify-center items-center p-[2em] mx-auto my-auto">
      <label
        htmlFor="file-upload"
        className="block w-full h-full border-4 border-dashed border-black dark:border-white rounded-lg flex flex-col items-center justify-center cursor-pointer text-center dark:text-white p-5"
      >
        <span className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-black dark:border-white text-4xl mb-2">
          +
        </span>
        <span className="text-lg">Upload File</span>
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".mkv,video/*"
        className={`sr-only`}
        onChange={handleChange}
      />
    </div>
  );
}