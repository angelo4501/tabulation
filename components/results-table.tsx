import { formatScore } from "@/lib/scoring";
import type { ContestantResult } from "@/lib/types";

export function ResultsTable({ results, publicView = false }: { results: ContestantResult[]; publicView?: boolean }) {
  const sorted = [...results].sort((left, right) => {
    if (left.rank === null && right.rank === null) return left.contestantNumber.localeCompare(right.contestantNumber);
    if (left.rank === null) return 1;
    if (right.rank === null) return -1;
    return left.rank - right.rank;
  });

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>#</th>
            <th>Contestant</th>
            <th>Character</th>
            <th>Average score</th>
            {!publicView ? <th>Status</th> : null}
          </tr>
        </thead>
        <tbody>
          {sorted.map((result) => (
            <tr className={result.rank && result.rank <= 3 ? "bg-[#fff7db]" : ""} key={result.contestantId}>
              <td className="text-2xl font-black text-[#34124d]">{result.rank ? `${result.rank}${result.isTied ? " (tie)" : ""}` : "-"}</td>
              <td className="font-black">{result.contestantNumber}</td>
              <td>{result.contestantName}</td>
              <td>{result.characterName}</td>
              <td className="font-bold">{formatScore(result.finalScore)}</td>
              {!publicView ? <td>{result.status} · {result.submittedJudgeCount}/{result.requiredJudgeCount} judges</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
