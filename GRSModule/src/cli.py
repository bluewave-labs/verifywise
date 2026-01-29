from __future__ import annotations

import argparse
from pathlib import Path

from rich.console import Console

from seeds.load import load_obligations_yaml
from seeds.export import export_obligations_jsonl

console = Console()


def _cmd_generate(args: argparse.Namespace) -> int:
    if args.stage != "seeds":
        console.print(f"[red]Unsupported stage:[/red] {args.stage}")
        return 2

    obligations_path = Path(args.obligations)
    out_dir = Path(args.out_dir) / args.dataset_version / "intermediate"
    out_path = out_dir / "behavioral_obligations.jsonl"

    version, obligations = load_obligations_yaml(obligations_path)
    export_obligations_jsonl(out_path, obligations)

    console.print("[bold green]Seed layer complete.[/bold green]")
    console.print(f"- obligations_version: {version}")
    console.print(f"- obligations_count: {len(obligations)}")
    console.print(f"- wrote: {out_path}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(prog="grs-scenarios")
    sub = parser.add_subparsers(dest="cmd", required=True)

    gen = sub.add_parser("generate", help="Generate artifacts for the scenario pipeline")
    gen.add_argument("--stage", choices=["seeds"], required=True)
    gen.add_argument("--dataset-version", default="grs_scenarios_v0.1")
    gen.add_argument("--obligations", default="configs/obligations.yaml")
    gen.add_argument("--out-dir", default="datasets")
    gen.set_defaults(func=_cmd_generate)

    args = parser.parse_args()
    rc = args.func(args)
    raise SystemExit(rc)