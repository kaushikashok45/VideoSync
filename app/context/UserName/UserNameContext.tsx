import { createContext } from "react";
import UserContext from "./types/UserContext";

const UserNameContext = createContext<UserContext>({
  userName: "anonymous user",
  updateUserName: (userName: string) => {
    console.log(userName);
  },
});

export default UserNameContext;
