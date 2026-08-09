import { useContext } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { Button, TextField } from "~/shared/ui-kit/index.ts";
import { useJoinBehaviour } from "../model/join-behaviour.ts";

export default function JoinForm() {
  const navigate = useNavigate();
  const { updateUserName } = useContext(SessionContext);
  const { name, code, nameError, codeError, setName, setCode, submit } =
    useJoinBehaviour({
      onJoin: (joinedName, joinedCode) => {
        updateUserName(joinedName);
        navigate(`/${joinedCode}/SetupScreen`);
      },
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="join-form"
      className="flex w-full flex-col gap-md"
    >
      <TextField
        label="Your name"
        placeholder="e.g. Ada"
        value={name}
        error={nameError ?? undefined}
        onChange={(event) => setName(event.target.value)}
      />
      <TextField
        label="Room code"
        placeholder="e.g. GLOW-42"
        autoCapitalize="characters"
        value={code}
        error={codeError ?? undefined}
        onChange={(event) => setCode(event.target.value)}
      />
      <Button variant="primary" size="lg" type="submit">
        Join watch party
      </Button>
    </form>
  );
}
