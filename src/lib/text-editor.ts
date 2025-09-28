import { User } from "./db";

export function getMentionMenuItems(users: Array<User>, editor: any) {
  return users.map((user) => ({
    title: user.name,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            user: user.name,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  }));
}
