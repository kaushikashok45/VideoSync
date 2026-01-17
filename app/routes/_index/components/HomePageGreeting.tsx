import { APP_NAME } from "~/Constants";

export default function HomePageGreeting() {
    return(
        <>
        <h2 className={`text-xl md:text-3xl self-center`}>
                    Welcome to{" "}
                    <span className={`font-yesteryear text-2xl md:text-4xl text-red-600`}>
                      {APP_NAME}
                    </span>
                    .How should we call you?
                  </h2>
        </>
    );
}