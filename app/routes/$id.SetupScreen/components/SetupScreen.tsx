import HostPartyButton from "./HostPartyButton";
import JoinPartyButton from "./JoinPartyButton";
import SetupScreenGreeting from "./SetupScreenGreeting";

export default function SetupScreen(){
    return (
    <div
      id="setup-screen"
      className={`flex flex-col h-full justify-center items-center gap-5 px-[2em] mx-auto my-auto`}>
      <SetupScreenGreeting />
        <div
            id="party-options"
            className={`flex flex-col md:flex-row gap-8 items-center md:justify-between`}
        >
            <HostPartyButton />
            <JoinPartyButton />
        </div>
    </div>
    );
}