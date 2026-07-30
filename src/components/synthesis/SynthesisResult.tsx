type Props = {
  lines: string[];
};

export function SynthesisResult({ lines }: Props) {
  return (
    <div className="result-box kv-list">
      {lines.map((line, index) => (
        <p key={`${index}-${line || "blank"}`} className={line.length === 0 ? "muted" : undefined}>
          {line || " "}
        </p>
      ))}
    </div>
  );
}
