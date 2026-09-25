import React, { useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "./MarkdownMessage";

interface AnimatedMarkdownMessageProps {
  content: string;
  onDone?: () => void;
}

export const AnimatedMarkdownMessage: React.FC<
  AnimatedMarkdownMessageProps
> = ({ content, onDone }) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const rafRef = useRef<number>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeoutRef = useRef<number | any>(null); // had to use any because didn't want to use Node.Timeout :v
  const doneRef = useRef(false);

  useEffect(() => {
    setVisibleChars(0);
    doneRef.current = false;
    function animate() {
      setVisibleChars((prev) => {
        if (prev < content.length) {
          timeoutRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(animate);
          }, 500); // 500ms per character
          return prev + 1;
        } else {
          if (!doneRef.current) {
            doneRef.current = true;
            if (onDone) onDone();
          }
          return prev;
        }
      });
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, onDone]);

  const isDone = visibleChars >= content.length;
  const partial = content.slice(0, visibleChars);

  return (
    <span className="inline-block">
      <MarkdownMessage content={partial} />
      {!isDone && <span className="blinking-cursor">|</span>}
    </span>
  );
};

// Add blinking cursor CSS (to be added to global styles):
// .blinking-cursor {
//   display: inline-block;
//   width: 1ch;
//   animation: blink 1s steps(1) infinite;
// }
// @keyframes blink {
//   0%, 50% { opacity: 1; }
//   51%, 100% { opacity: 0; }
// }
