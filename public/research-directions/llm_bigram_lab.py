"""Synthetic character-model lab; Python standard library only.

This is an interpretable count-based baseline, not Transformer pretraining.
The vocabulary and data split are part of the declared synthetic task.
"""
from collections import Counter, defaultdict
from math import exp, log
import json

TRAIN = ["ab", "ab", "ba", "aa"]
VALID = ["bb", "aab"]
TEST = ["aba", "bba"]
VOCAB = ("a", "b", "$")  # '$' is an output end token; '^' is input-only start.


def events(text):
    previous = "^"
    for current in text + "$":
        yield previous, current
        previous = current


bigram_counts = defaultdict(Counter)
unigram_counts = Counter()
for text in TRAIN:
    for previous, current in events(text):
        bigram_counts[previous][current] += 1
        unigram_counts[current] += 1


def probability(previous, current, alpha, kind):
    assert alpha > 0 and current in VOCAB
    counts = bigram_counts.get(previous, Counter()) if kind == "bigram" else unigram_counts
    return (counts[current] + alpha) / (sum(counts.values()) + alpha * len(VOCAB))


def evaluate(texts, alpha, kind):
    negative_log_likelihood = 0.0
    correct = total = 0
    for text in texts:
        for previous, current in events(text):
            probabilities = [probability(previous, token, alpha, kind) for token in VOCAB]
            assert abs(sum(probabilities) - 1.0) < 1e-12
            negative_log_likelihood -= log(probability(previous, current, alpha, kind))
            # Deterministic tie-break uses declared VOCAB order.
            prediction = VOCAB[max(range(len(VOCAB)), key=lambda i: probabilities[i])]
            correct += prediction == current
            total += 1
    nll = negative_log_likelihood / total
    return {"tokens": total, "nll": nll, "perplexity": exp(nll), "next_token_accuracy": correct / total}


def run():
    results = {}
    for kind in ("unigram", "bigram"):
        candidates = [(alpha, evaluate(VALID, alpha, kind)) for alpha in (0.1, 0.5, 1.0)]
        # Pick with validation only; ties prefer the earlier declared candidate.
        alpha, _ = min(candidates, key=lambda item: item[1]["nll"])
        results[kind] = {
            "validation_candidates": [{"alpha": a, **metrics} for a, metrics in candidates],
            "selected_alpha": alpha,
            "test": evaluate(TEST, alpha, kind),
        }
    assert sum(unigram_counts.values()) == 12
    assert bigram_counts["^"] == Counter({"a": 3, "b": 1})
    return results


if __name__ == "__main__":
    print(json.dumps(run(), ensure_ascii=False, indent=2))
