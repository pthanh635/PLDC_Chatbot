import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Icon } from "./Icon";

interface CopyProps {
  value: string;
}

export const Copy: React.FC<CopyProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  return (
    <CopyToClipboard
      text={value}
      onCopy={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
    >
      <button
        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
        style={{ cursor: "pointer" }}
        title={copied ? "Copied!" : "Copy"}
        type="button"
      >
        <Icon name="copy" size={14} color="currentColor" />
        <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
      </button>
    </CopyToClipboard>
  );
};
