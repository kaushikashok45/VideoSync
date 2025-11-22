export type toastMessageMeta = {
    message: string;
    userName: string;
    icon: any;
}

export default function ToastMessageView({ message, userName, icon }: toastMessageMeta) {
    return (
        <div className={`font-overpass`}>
            <span className={'text-2xl p-2 border rounded-full border-gray-600 bg-white text-black'} dangerouslySetInnerHTML={{ __html: icon }}></span> <span className={`font-yesteryear text-2xl text-red-600`}>{userName}</span> {message}.
        </div>
    );
}