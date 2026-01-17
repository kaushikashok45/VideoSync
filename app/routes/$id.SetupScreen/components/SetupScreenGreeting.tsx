import { useContext } from "react";
import UserNameContext from "../../../context/UserName/UserNameContext";

export default function SetupScreenGreeting() {
    const { userName } = useContext(UserNameContext);
    return (
        <>
          <h2 className={`text-xl md:text-3xl`}>
        Howdy{" "}
        <span className={`font-yesteryear text-2xl md:text-4xl text-red-600`}>
          {userName}
        </span>{" "}
        ! What would you like to do?
      </h2>
        </>
    );
}