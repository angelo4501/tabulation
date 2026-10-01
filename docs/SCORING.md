# Scoring

KALOOK! calculates official results on the server in `lib/scoring.ts`.

## Criteria

Default Kalook-Alike criteria:

| Criterion | Weight |
|---|---:|
| Physical Resemblance | 40% |
| Costume and Styling | 20% |
| Mannerisms and Characterization | 20% |
| Stage Presence | 10% |
| Audience Impact | 10% |

Active criteria must total exactly 100% before an event can move to `open`.

## Score range

The default score range is 1 to 100. Each criterion stores its own `min_score` and `max_score`; browser inputs and server actions validate the range, and the database trigger rejects out-of-range raw scores.

## Calculation

For every criterion:

```text
weighted_score = raw_score / maximum_score x criterion_weight
```

For every judge and contestant:

```text
judge_total = sum(weighted criterion scores)
```

For every contestant:

```text
final_score = average(all submitted judge totals)
```

Rules:

- Only submitted score sheets are used.
- Missing scores are not treated as zero.
- Results remain incomplete until all assigned judges submit.
- Withdrawn contestants are excluded from rankings.
- Raw scores are preserved.
- Display uses two decimal places.
- Browser-sent totals are ignored.

## Tie-breaks

Ties are resolved in this order:

1. Higher Physical Resemblance average.
2. Higher Mannerisms and Characterization average.
3. Higher Stage Presence average.
4. If still unresolved, contestants display as tied.

No random tie-breaking is used.
