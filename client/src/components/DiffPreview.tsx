const maximumPreviewLines = 500;

function lineKind(line: string): string {
  if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("diff --git")) return "diff-file";
  if (line.startsWith("@@")) return "diff-hunk";
  if (line.startsWith("+") && !line.startsWith("+++")) return "diff-addition";
  if (line.startsWith("-") && !line.startsWith("---")) return "diff-deletion";
  return "diff-context";
}

export function DiffPreview({ diff }: { diff: string }) {
  if (!diff.trim()) return null;
  const lines = diff.split("\n");
  const previewLines = lines.slice(0, maximumPreviewLines);
  return <section className="diff-preview-section" aria-labelledby="diff-preview-title"><header><h3 id="diff-preview-title">Diff preview</h3><p>{lines.length > maximumPreviewLines ? `Showing the first ${maximumPreviewLines} of ${lines.length} lines.` : `${lines.length} lines`}</p></header><ol className="diff-preview" aria-label="Pasted diff preview">{previewLines.map((line, index) => <li className={lineKind(line)} key={`${index}-${line}`}><code>{line || " "}</code></li>)}</ol></section>;
}
