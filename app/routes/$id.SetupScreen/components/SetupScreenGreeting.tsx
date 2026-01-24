import { useContext } from "react";
import SessionContext from "../../../context/Session/logic/SessionContext";

export default function SetupScreenGreeting() {
    const { userName } = useContext(SessionContext);
    return (
        <>
            <h2 className={`text-xl md:text-3xl`}>
                Howdy{" "}
                <span
                    className={`font-yesteryear text-2xl md:text-4xl text-red-600`}
                >
                    {userName}
                </span>{" "}
                ! What would you like to do?
            </h2>
        </>
    );
}
