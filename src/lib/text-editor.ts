import { User } from "./db";

import * as Y from "yjs";

export function getMentionMenuItems(users: Array<User>, editor: any) {
  return users.map((user) => ({
    title: user.name,
    user: user,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            userName: user.name,
            userId: user.id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  }));
}

export function jsonbToYjsUpdate(dbContent: any[]): Uint8Array {
  const ydoc = new Y.Doc();

  const yarray = ydoc.getArray("document-store");

  yarray.push(dbContent);

  return Y.encodeStateAsUpdate(ydoc); // Uint8Array
}
