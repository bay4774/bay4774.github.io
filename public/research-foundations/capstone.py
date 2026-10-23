#!/usr/bin/env python3
"""Public synthetic measurement capstone, Python 3.10+, standard library only.

Usage:
  python capstone.py
  python capstone.py --seed 7 --train 12 --test 40 --repeats 5
  python capstone.py --json
  python capstone.py --self-check

All inputs are fixed parameters or generated in memory. No network, file reads,
file writes, downloads, uploads, or private data are used. Output goes to stdout.
The fitting method is centered one-predictor ordinary least squares; no matrix
inverse is formed. This is teaching code, not a general linear algebra solver.

The 95% marginal parameter intervals use the KNOWN synthetic Gaussian sigma.
They are evaluated only when the mean model is correctly linear. They are not
unknown-sigma t intervals, simultaneous intervals, or prediction intervals.
"""
from __future__ import annotations

import argparse
import json
import math
import platform
import random
import statistics
from dataclasses import dataclass

BETA0 = 0.75
BETA1 = 1.5
SIGMA = 0.3
Z975 = statistics.NormalDist().inv_cdf(0.975)
SCENARIOS = (
    ("matched", 0.0, (-1.0, 1.0)),
    ("range_shift", 0.0, (1.0, 2.0)),
    ("quadratic_mismatch", 0.75, (-1.0, 1.0)),
    ("quadratic_and_shift", 0.75, (1.0, 2.0)),
)


@dataclass(frozen=True)
class Fit:
    intercept: float
    slope: float
    x_mean: float
    sxx: float
    residual_variance: float
    n: int

    def predict(self, x: float) -> float:
        return self.intercept + self.slope * x


def fit_line(xs: list[float], ys: list[float]) -> Fit:
    """Centered least squares, with an explicit identifiability check."""
    if len(xs) != len(ys) or len(xs) < 3:
        raise ValueError("Need equal-length x/y arrays with at least 3 rows.")
    if not all(math.isfinite(v) for v in xs + ys):
        raise ValueError("Only finite observations are supported.")
    n = len(xs)
    xm = math.fsum(xs) / n
    ym = math.fsum(ys) / n
    dx = [x - xm for x in xs]
    sxx = math.fsum(d * d for d in dx)
    # This tutorial generates O(1)-scale x. Do not reuse an arbitrary absolute
    # threshold for every unit system; actual floating-point inputs matter.
    if sxx <= 0.0 or not math.isfinite(sxx):
        raise ValueError("Slope is not identifiable: no finite input spread.")
    slope = math.fsum(d * (y - ym) for d, y in zip(dx, ys)) / sxx
    intercept = ym - slope * xm
    rss = math.fsum((y - (intercept + slope * x)) ** 2
                    for x, y in zip(xs, ys))
    return Fit(intercept, slope, xm, sxx, rss / (n - 2), n)


def signal(x: float, quadratic: float) -> float:
    return BETA0 + BETA1 * x + quadratic * x * x


def sample_data(n: int, bounds: tuple[float, float], quadratic: float,
                sigma: float, x_seed: int, noise_seed: int
                ) -> tuple[list[float], list[float], list[float]]:
    """Input and noise have distinct deterministic PRNG streams."""
    xrng = random.Random(x_seed)
    nrng = random.Random(noise_seed)
    xs = [xrng.uniform(*bounds) for _ in range(n)]
    truth = [signal(x, quadratic) for x in xs]
    ys = [m + nrng.gauss(0.0, sigma) for m in truth]
    return xs, ys, truth


def mse(actual: list[float], predicted: list[float]) -> float:
    if not actual or len(actual) != len(predicted):
        raise ValueError("MSE needs matching nonempty sequences.")
    return math.fsum((a - b) ** 2 for a, b in zip(actual, predicted)) / len(actual)


def mean_and_mcse(values: list[float]) -> dict[str, float]:
    """MC standard error of a mean across independent simulation replicates."""
    return {
        "mean": statistics.fmean(values),
        "mcse": statistics.stdev(values) / math.sqrt(len(values)),
    }


def experiment(seed: int, n_train: int, n_test: int, repeats: int,
               quadratic: float, test_bounds: tuple[float, float],
               sigma: float = SIGMA) -> dict:
    metrics = {name: [] for name in (
        "train_observed_mse", "test_observed_mse", "test_signal_mse",
        "baseline_test_observed_mse", "intercept", "slope",
        "slope_squared_error", "slope_conditional_variance",
        "known_sigma_interval_halfwidth_intercept",
        "known_sigma_interval_halfwidth_slope",
    )}
    covers_intercept: list[float] = []
    covers_slope: list[float] = []
    first = None
    for rep in range(repeats):
        # The same input/noise streams are reused BETWEEN scenarios as a paired
        # comparison, but each TRAIN/TEST sample and each REP has its own stream.
        # Using separate Random objects also avoids touching global RNG state.
        rep_seed = seed + rep * 100
        xs, ys, _ = sample_data(n_train, (-1.0, 1.0), quadratic, sigma,
                                rep_seed + 1, rep_seed + 2)
        tx, ty, tm = sample_data(n_test, test_bounds, quadratic, sigma,
                                 rep_seed + 3, rep_seed + 4)
        fitted = fit_line(xs, ys)
        train_pred = [fitted.predict(x) for x in xs]
        test_pred = [fitted.predict(x) for x in tx]
        train_mean = math.fsum(ys) / n_train
        v1 = sigma * sigma / fitted.sxx
        v0 = sigma * sigma * (1.0 / n_train +
                              fitted.x_mean * fitted.x_mean / fitted.sxx)
        hw1 = Z975 * math.sqrt(v1)
        hw0 = Z975 * math.sqrt(v0)
        row = {
            "train_observed_mse": mse(ys, train_pred),
            "test_observed_mse": mse(ty, test_pred),
            "test_signal_mse": mse(tm, test_pred),
            "baseline_test_observed_mse": mse(ty, [train_mean] * n_test),
            "intercept": fitted.intercept,
            "slope": fitted.slope,
            "slope_squared_error": (fitted.slope - BETA1) ** 2,
            "slope_conditional_variance": v1,
            "known_sigma_interval_halfwidth_intercept": hw0,
            "known_sigma_interval_halfwidth_slope": hw1,
        }
        for key, value in row.items():
            metrics[key].append(value)
        if quadratic == 0.0:
            covers_intercept.append(float(abs(fitted.intercept - BETA0) <= hw0))
            covers_slope.append(float(abs(fitted.slope - BETA1) <= hw1))
        if rep == 0:
            residuals = [y - pred for y, pred in zip(ys, train_pred)]
            first = {
                "intercept": fitted.intercept, "slope": fitted.slope,
                "estimated_noise_sigma": math.sqrt(fitted.residual_variance),
                "sum_residuals": math.fsum(residuals),
                "x_dot_residual": math.fsum(x * r for x, r in zip(xs, residuals)),
            }
    result = {
        "train_n": n_train, "test_n": n_test, "repeats": repeats,
        "train_range": [-1.0, 1.0], "test_range": list(test_bounds),
        "true_quadratic_coefficient": quadratic,
        "metrics": {key: mean_and_mcse(values)
                    for key, values in metrics.items()},
        "first_replicate": first,
    }
    if quadratic == 0.0:
        result["known_sigma_marginal_coverage"] = {
            "intercept": mean_and_mcse(covers_intercept),
            "slope": mean_and_mcse(covers_slope),
            "nominal": 0.95,
            "nominal_mcse": math.sqrt(0.95 * 0.05 / repeats),
        }
    else:
        result["known_sigma_marginal_coverage"] = None
        result["interval_note"] = (
            "No nominal linear-model coverage claim under mean misspecification. "
            "Generating coefficients are not necessarily the linear projection target."
        )
    return result


def self_check() -> dict[str, str]:
    """Mathematical invariants; these check implementation, not research claims."""
    f = fit_line([-1.0, 0.0, 1.0], [-0.8, 0.7, 2.4])
    assert math.isclose(f.intercept, 23.0 / 30.0, abs_tol=1e-12)
    assert math.isclose(f.slope, 1.6, abs_tol=1e-12)
    f2 = fit_line([-1.0, 0.0, 1.0], [-0.75, 0.75, 2.25])
    assert math.isclose(f2.intercept, BETA0, abs_tol=1e-12)
    assert math.isclose(f2.slope, BETA1, abs_tol=1e-12)
    assert f2.residual_variance < 1e-25
    try:
        fit_line([1.0] * 3, [1.0, 2.0, 3.0])
    except ValueError:
        pass
    else:
        raise AssertionError("Constant input must be rejected.")
    a = sample_data(5, (-1.0, 1.0), 0.0, SIGMA, 3, 4)
    b = sample_data(5, (-1.0, 1.0), 0.0, SIGMA, 3, 4)
    assert a == b
    other = sample_data(5, (-1.0, 1.0), 0.0, SIGMA, 5, 6)
    assert a != other
    return {
        "three_point_fit": "passed",
        "noiseless_recovery": "passed",
        "unidentifiable_input_rejected": "passed",
        "same_seed_reproducible": "passed",
        "separate_streams_differ": "passed",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--seed", type=int, default=20261016)
    parser.add_argument("--train", type=int, default=80)
    parser.add_argument("--test", type=int, default=200)
    parser.add_argument("--repeats", type=int, default=300)
    parser.add_argument("--json", action="store_true",
                        help="Print structured results to stdout; no file is written.")
    parser.add_argument("--self-check", action="store_true",
                        help="Run invariant checks only.")
    args = parser.parse_args()
    if args.seed < 0 or args.train < 3 or args.test < 1 or args.repeats < 2:
        parser.error("Need seed >= 0, train >= 3, test >= 1, repeats >= 2.")
    checks = self_check()
    if args.self_check:
        print(json.dumps(checks, indent=2))
        return
    results = {
        "metadata": {
            "purpose": "public synthetic educational demonstration",
            "python": platform.python_version(), "seed": args.seed,
            "train": args.train, "test": args.test, "repeats": args.repeats,
            "beta0": BETA0, "beta1": BETA1, "sigma": SIGMA,
            "intervals": "known-sigma Gaussian 95% marginal parameter intervals",
            "rng": "random.Random, separate train/test input/noise streams",
            "comparison": "paired scenarios, independent replicates",
            "io": "in-memory synthetic data; stdout only",
        },
        "self_checks": checks,
        "scenarios": {
            name: experiment(args.seed, args.train, args.test, args.repeats,
                             quadratic, bounds)
            for name, quadratic, bounds in SCENARIOS
        },
        "sample_size_comparison": {
            str(n): experiment(args.seed, n, args.test, args.repeats,
                                0.0, (-1.0, 1.0))
            for n in (20, 80, 320)
        },
    }
    if args.json:
        print(json.dumps(results, indent=2, allow_nan=False))
        return
    print("Synthetic least-squares capstone (standard library only)")
    print(json.dumps(results["metadata"], ensure_ascii=False))
    print("Invariant checks: " + ", ".join(checks.values()))
    print("\nScenario                  train MSE    test MSE   signal MSE   mean-only MSE")
    for name, row in results["scenarios"].items():
        m = row["metrics"]
        print(f"{name:25s} "
              f"{m['train_observed_mse']['mean']:11.6f} "
              f"{m['test_observed_mse']['mean']:11.6f} "
              f"{m['test_signal_mse']['mean']:12.6f} "
              f"{m['baseline_test_observed_mse']['mean']:14.6f}")
    print("\nMatched sample-size comparison")
    print(" n    slope squared error   predicted conditional variance   coverage slope")
    for n, row in results["sample_size_comparison"].items():
        m = row["metrics"]
        c = row["known_sigma_marginal_coverage"]["slope"]["mean"]
        print(f"{n:>3s} {m['slope_squared_error']['mean']:21.8f} "
              f"{m['slope_conditional_variance']['mean']:32.8f} {c:16.5f}")
    print("\nThese are simulation results, not personal research findings.")
    print("Under mismatch no nominal linear-model coverage is claimed.")
    print("Use --json for MC standard errors, marginal intervals, and parameters.")


if __name__ == "__main__":
    main()
