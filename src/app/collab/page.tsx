import EditorFrame from "@/components/editor/editor-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";

export default function Collab() {
  return (
    <EditorFrame>
      <RealTimeEditor
        roomId={`collab-test`}
        websocketUrl={process.env.WEBSOCKET_URL}
        userName={""}
      />
    </EditorFrame>
  );
}
