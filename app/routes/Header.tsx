import { APP_NAME } from "~/Constants";

export default function Header() {
    return (
        <header className={`w-full mt-4`}>
            <div id="app-name" className={`text-center`}>
                <h1 className={`font-yesteryear text-4xl text-red-600`}>
                    {APP_NAME}
                </h1>
            </div>
        </header>
    );
}
