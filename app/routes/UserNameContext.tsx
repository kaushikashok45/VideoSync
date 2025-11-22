import { createContext } from "react";

export type UserContext = {
    userName: string;
    updateUserName: (userName: string) => void;
};
const UserNameContext = createContext<UserContext>({userName:'anonymous user',updateUserName:(userName:string) => {}});

export default UserNameContext;