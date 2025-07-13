import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function UploadFile() {

    const navigate = useNavigate();
    const handleChange = (event:React.ChangeEvent<HTMLInputElement>)=>{
        const file =  event.target.files?.[0];
        console.log(file);
        event.target.value = '';
        if(file){
            const videoURL = URL.createObjectURL(file);
            navigate('/HostVideoPlayer', { state: { videoURL: videoURL } });
        }

    }

    useEffect(() => {
        console.log("Component hydrated");
    }, []);

    return (
        <div className="w-1/2 h-1/2">
            <label
                htmlFor="file-upload"
                className="block w-full h-full border-4 border-dashed border-white rounded-lg flex flex-col items-center justify-center cursor-pointer text-center text-white"
            >
            <span className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-white text-4xl mb-2">
              +
            </span>
                <span className="text-lg">Upload File</span>
            </label>
            <input
                id="file-upload"
                type="file"
                accept="video/*"
                className={`sr-only`}
                onChange={handleChange}
            />
        </div>
    )
}