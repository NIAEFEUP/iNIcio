import { createReactInlineContentSpec } from "@blocknote/react";

export const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      userName: {
        default: "string",
      },
      userId: {
        default: "string",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
        @{props.inlineContent.props.userName}
      </span>
    ),
  },
);
