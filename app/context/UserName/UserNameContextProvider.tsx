import UserNameContext from "./UserNameContext";
import { useState } from "react";

export default function UserNameContextProvider({ children }: any) {
  const [context, setContext] = useState("anonymous user");

  const updateUserName = (userName: string) => {
    setContext(userName);
  };

  return (
    <UserNameContext.Provider value={{ userName: context, updateUserName }}>
      {children}
    </UserNameContext.Provider>
  );
}
