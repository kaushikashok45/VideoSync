import { useState } from "react";
import { hostSourceStore } from "./host-source-store.ts";
import { resolveSource } from "./source-resolver.ts";
import { lookupLocalMetadata } from "./lookup-local-metadata.ts";
import type { FetchMetadataLike, SourceKind } from "./source-resolver.ts";

export type { SourceKind } from "./source-resolver.ts";

export interface SourceBehaviourDeps {
  roomId: string;
  fetchMetadataLike?: FetchMetadataLike;
  onDone: (route: string) => void;
}

export function useSourceBehaviour({
  roomId,
  fetchMetadataLike,
  onDone,
}: SourceBehaviourDeps) {
  const [source, setSource] = useState<SourceKind>("upload");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchSource = (next: SourceKind) => {
    if (next === source) return;
    setError(null);
    if (next === "upload") {
      setUrl("");
    } else {
      setFile(null);
    }
    setSource(next);
  };
  const updateUrl = (next: string) => {
    setError(null);
    setUrl(next);
  };
  const updateFile = (next: File | null) => {
    setError(null);
    setFile(next);
  };

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    const decision = await resolveSource(
      { mode: source, url, file },
      { roomId, fetchMetadataLike },
    );
    if (decision.status === "error") {
      setError(decision.error);
    } else {
      hostSourceStore.getState().commit({
        source: decision.source,
        file: decision.source.mode === "upload" ? file : null,
        metadata: decision.metadata,
      });
      onDone(decision.route);
      if (decision.source.mode === "upload" && file !== null) {
        void lookupLocalMetadata(file, fetchMetadataLike).then((metadata) => {
          const current = hostSourceStore.getState();
          if (
            current.file !== file || current.source === null ||
            metadata === null
          ) {
            return;
          }
          current.commit({
            source: current.source,
            file: current.file,
            metadata,
          });
        });
      }
    }
    setPending(false);
  };

  return {
    source,
    setSource: switchSource,
    url,
    setUrl: updateUrl,
    file,
    setFile: updateFile,
    pending,
    error,
    submit,
  };
}
