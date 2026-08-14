import { useRef, type ChangeEvent, type UIEvent } from "react";

interface LineNumberedTextareaProps {
  id: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  className?: string;
}

export function LineNumberedTextarea({ id, value, onChange, placeholder, rows, required = false, className = "" }: LineNumberedTextareaProps) {
  const lineNumbers = useRef<HTMLOutputElement>(null);
  const lineCount = Math.max(value.split("\n").length, rows);

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (lineNumbers.current) lineNumbers.current.scrollTop = event.currentTarget.scrollTop;
  }

  return <section className={`line-numbered-input ${className}`}><output className="line-numbers" aria-hidden="true" ref={lineNumbers}>{Array.from({ length: lineCount }, (_, index) => index + 1).join("\n")}</output><textarea id={id} value={value} onChange={onChange} onScroll={syncScroll} placeholder={placeholder} rows={rows} required={required} spellCheck={false} /></section>;
}
