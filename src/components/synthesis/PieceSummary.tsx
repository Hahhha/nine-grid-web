type Props = {
  lines: string[];
};

export function PieceSummary({ lines }: Props) {
  return (
    <div className="summary-box">
      <div className="pill-row">
        {lines.map((line) => (
          <span key={line} className="pill">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
