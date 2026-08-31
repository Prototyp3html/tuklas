"""Phase 12 evaluation harness.

Compares agent output against the hand-labeled dataset in data/labeled/ and prints
the six MVP metrics (see docs/EVALUATION.md).

TODO (Milestone 12): implement. Outline from BUILD_GUIDE.md:

    import pandas as pd
    from sklearn.metrics import precision_score, recall_score, f1_score

    labeled = pd.read_csv("data/labeled/businesses_100.csv")
    preds   = pd.read_csv("data/labeled/agent_output.csv")
    df = labeled.merge(preds, on="business_id")

    # website detection accuracy, qualification F1, precision@10,
    # evidence grounding rate, AI cost per qualified lead
"""

if __name__ == "__main__":
    raise SystemExit("Not implemented yet — Milestone 12.")
