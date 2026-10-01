import Link from "next/link";
import { getPublishedResults } from "@/lib/data";
import { formatScore } from "@/lib/scoring";

export default async function PresentationModePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, tabulation } = await getPublishedResults(eventId);
  const winners = tabulation.results
    .filter((result) => result.status === "active" && result.rank !== null)
    .sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999));

  return (
    <main className="min-h-screen bg-[#210b33] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link className="no-print text-sm font-bold text-[#d6a738] underline" href={`/results/${eventId}`}>Back to results</Link>
        <p className="mt-8 text-center text-lg uppercase tracking-[0.35em] text-[#d6a738]">Official Winners</p>
        <h1 className="elegant-heading mt-4 text-center text-6xl font-black md:text-8xl">{event.name}</h1>
        <div className="mt-12 grid gap-6">
          {winners.map((winner) => (
            <section className={`rounded-[2rem] border border-white/10 p-8 text-center ${winner.rank && winner.rank <= 3 ? "bg-white text-[#34124d]" : "bg-white/10"}`} key={winner.contestantId}>
              <p className="text-5xl font-black">Rank {winner.rank}{winner.isTied ? " (tie)" : ""}</p>
              <h2 className="elegant-heading mt-4 text-5xl font-black md:text-7xl">{winner.contestantName}</h2>
              <p className="mt-3 text-3xl">{winner.characterName}</p>
              <p className="mt-5 text-4xl font-black text-[#d6a738]">{formatScore(winner.finalScore)}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
