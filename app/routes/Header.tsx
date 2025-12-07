import { Link } from "@remix-run/react";
import { APP_NAME } from "~/Constants";

export default function Header() {
    return (
        <header className={`w-full mt-4`}>
            <div id="app-name" className={`text-center`}>
                <Link to="/">
                    <h1 className={`font-yesteryear text-4xl text-red-600`}>
                        {APP_NAME}
                    </h1>
                </Link>
            </div>
        </header>
    );
}
