import React from "react";

interface AvatarBtnProps {
  label?: string;
  className?: string;
}

export const AvatarBtn: React.FC<AvatarBtnProps> = ({
  label = "S",
  className = "",
}) => (
  <button
    className={`w-8 h-8 bg-sentgray-50 rounded-full flex items-center justify-center text-sm font-bold border-2 border-sentgray-900 ${className}`}
  >
    {label}
  </button>
);
