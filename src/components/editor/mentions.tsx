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
      <span style={{ backgroundColor: "#8400ff33" }}>
        @{props.inlineContent.props.userName}
      </span>
    ),
  },
);
