"""
Unit tests for `.github/scripts/check_workflows.py`.

The script runs against the real `.github/workflows/` on every pull request,
which is the check that matters. These cover the judgements it makes, which
that run cannot: that it says yes to a workflow with a real step and no to one
without, and that the scaffolding list does not accidentally swallow something
substantive.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / ".github" / "scripts" / "check_workflows.py"


def _load():
    spec = importlib.util.spec_from_file_location("check_workflows", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check_workflows = _load()


# ---------------------------------------------------------------------------
# Scaffolding
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "uses",
    [
        "actions/checkout@v4",
        "actions/checkout@v7",
        "actions/setup-node@v7",
        "actions/setup-python@v5",
        "actions/cache@v4",
    ],
)
def test_setup_actions_are_scaffolding(uses):
    assert check_workflows.is_scaffolding({"uses": uses}) is True


def test_version_is_ignored_when_matching(uses="actions/checkout@some-sha"):
    """
    Matched on the part before the `@`, so a Dependabot bump does not need an
    edit here -- and pinning to a SHA, which is the recommendation, still
    matches.
    """
    assert check_workflows.is_scaffolding({"uses": uses}) is True


@pytest.mark.parametrize(
    "step",
    [
        {"run": "npx tsc --noEmit"},
        {"run": "echo hello"},
        {"uses": "github/codeql-action/analyze@v3"},
        {"uses": "actions/github-script@v7"},
        {"uses": "actions/upload-artifact@v4"},
    ],
)
def test_real_steps_are_not_scaffolding(step):
    assert check_workflows.is_scaffolding(step) is False


def test_a_run_step_is_substantive_even_if_it_also_uses_an_action():
    assert (
        check_workflows.is_scaffolding({"run": "true", "uses": "actions/checkout@v4"})
        is False
    )


# ---------------------------------------------------------------------------
# Counting steps in a job
# ---------------------------------------------------------------------------


def test_a_checkout_only_job_has_no_substantive_steps():
    """The exact shape of the four hollow workflows."""
    job = yaml.safe_load(
        """
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
        """
    )

    assert check_workflows.substantive_steps(job) == 0


def test_setup_without_a_check_is_still_nothing():
    """
    The tempting near-miss: install everything, then forget to run the tool.
    """
    job = yaml.safe_load(
        """
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v7
          - uses: actions/cache@v4
        """
    )

    assert check_workflows.substantive_steps(job) == 0


def test_a_job_that_runs_something_counts_it():
    job = yaml.safe_load(
        """
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v7
          - run: npm ci
          - run: npx tsc --noEmit
        """
    )

    assert check_workflows.substantive_steps(job) == 2


def test_a_reusable_workflow_job_counts_as_a_check():
    """
    `jobs.x.uses` delegates the steps to another file. Still a real check, just
    not one defined here -- and treating it as hollow would be wrong.
    """
    job = yaml.safe_load("uses: ./.github/workflows/reusable.yml")

    assert check_workflows.substantive_steps(job) == 1


def test_a_job_with_no_steps_at_all_is_hollow():
    assert check_workflows.substantive_steps({"runs-on": "ubuntu-latest"}) == 0


def test_a_malformed_step_does_not_crash_the_check():
    """
    Neither `run` nor `uses`. Counted as not-a-check rather than raising --
    this script's job is to fail a pull request with a readable message, not to
    traceback on one.
    """
    job = {"steps": [{"name": "just a label"}]}

    assert check_workflows.substantive_steps(job) == 0


# ---------------------------------------------------------------------------
# The repository as it stands
# ---------------------------------------------------------------------------


def test_every_workflow_in_this_repository_passes():
    """
    Duplicates what CI does, so a hollow workflow fails locally too -- before
    the pull request, which is when it is cheapest to notice.
    """
    import os

    cwd = os.getcwd()
    os.chdir(REPO_ROOT)
    try:
        assert check_workflows.main() == 0
    finally:
        os.chdir(cwd)


def test_no_workflow_file_is_empty():
    """
    `release-drafter.yml` was zero bytes. GitHub reports that as a broken
    workflow rather than as an absent one, so it showed up in the Actions tab
    as a permanent error.
    """
    empty = [
        path.name
        for path in sorted((REPO_ROOT / ".github" / "workflows").glob("*.y*ml"))
        if not path.read_text().strip()
    ]

    assert empty == [], f"empty workflow files: {empty}"
