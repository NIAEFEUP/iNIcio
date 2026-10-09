import { User } from "./db";

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

export function isBlockEmpty(block: any): boolean {
  if (!block) return true;

  if (
    block.type === "image" ||
    block.type === "video" ||
    block.type === "audio" ||
    block.type === "file" ||
    block.type === "table"
  ) {
    return false;
  }

  if (Array.isArray(block.content)) {
    const hasContent = block.content.some((item: any) => {
      if (!item) return false;
      if (typeof item === "string") return item.trim().length > 0;
      if (item.type === "text") {
        return typeof item.text === "string" && item.text.trim().length > 0;
      }
      return true;
    });
    if (hasContent) return false;
  } else if (typeof block.content === "string") {
    if (block.content.trim().length > 0) return false;
  }

  if (Array.isArray(block.children) && block.children.length > 0) {
    if (block.children.some((child: any) => !isBlockEmpty(child))) {
      return false;
    }
  }

  return true;
}

export function isDocumentEmpty(document?: Array<any> | null): boolean {
  if (!document || document.length === 0) return true;
  return document.every(isBlockEmpty);
}
