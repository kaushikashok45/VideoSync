import { useContext } from "react";
import { useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { useSourceBehaviour } from "~/features/media-source/model/source-behaviour.ts";
import SourcePicker from "~/features/media-source/ui/source-picker.tsx";
import UploadDropzone from "~/features/media-source/ui/upload-dropzone.tsx";
import UrlField from "~/features/media-source/ui/url-field.tsx";
import { Badge, Button } from "~/shared/ui-kit/index.ts";

export default function UploadPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateRoomId } = useContext(SessionContext);
  const roomId = id ?? "";
  const { source, setSource, url, setUrl, setFile, pending, error, submit } =
    useSourceBehaviour({
      roomId,
      onDone: (route) => {
        updateRoomId(roomId);
        navigate(route);
      },
    });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-xl bg-bg px-md py-xxl">
      <h1 className="font-script text-3xl text-ink">Start the show</h1>
      <p className="max-w-[45ch] text-center font-mono text-sm text-ink-muted">
        Upload a video file or paste a link. Your friends watch with you in real
        time.
      </p>
      <SourcePicker source={source} onChange={setSource} />
      {source === "url"
        ? (
          <UrlField
            value={url}
            onChange={setUrl}
            error={error}
          />
        )
        : (
          <div className="flex w-full max-w-md flex-col gap-md">
            <UploadDropzone onFile={setFile} />
            {error !== null
              ? (
                <Badge variant="danger" data-testid="error-banner">
                  {error}
                </Badge>
              )
              : null}
          </div>
        )}
      <Button size="lg" loading={pending} onClick={submit}>
        {source === "url" ? "Start watching" : "Continue"}
      </Button>
    </main>
  );
}
