from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import json

from rich.console import Console

from seeds.load import load_obligations_yaml
from seeds.export import export_obligations_jsonl
from io_utils.manifest import write_manifest
from io_utils.checksums import sha256_file
from io_utils.jsonl import write_jsonl, read_jsonl
from reports.seed_report import build_seed_report
from reports.render_report import build_render_report
from reports.perturb_report import build_perturb_report

from render.load_catalogs import load_render_inputs
from render.renderer import render_base_scenarios, RenderConfig
from render.dedup import prompt_hash

from perturb.load_catalog import load_mutation_catalog
from perturb.perturbator import apply_mutations

from validate.validator import validate_candidates, ValidateConfig
from reports.validate_report import build_validate_report

from seeds.index import ObligationIndex
from validate.enrich import enrich_with_obligations

from infer.runner import run_inference, InferConfig
from llm.mock import MockChatClient
from llm.openrouter import OpenRouterChatClient

import json


console = Console()


def _cmd_generate(args: argparse.Namespace) -> int:
    dataset_root = Path(args.out_dir) / args.dataset_version
    intermediate_dir = dataset_root / "intermediate"
    final_dir = dataset_root / "final"

    obligations_path = Path(args.obligations)

    obligations_out = intermediate_dir / "behavioral_obligations.jsonl"
    manifest_path = final_dir / "manifest.json"
    report_path = final_dir / "sampling_report.json"

    if args.stage == "seeds":
        obligations_version, obligations = load_obligations_yaml(obligations_path)
        export_obligations_jsonl(obligations_out, obligations)

        report = build_seed_report(obligations_version=obligations_version, obligations=obligations)
        report["generated_at"] = datetime.now(timezone.utc).isoformat()
        report["dataset_version"] = args.dataset_version
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

        manifest = {
            "dataset_version": args.dataset_version,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "stage": "seeds",
            "inputs": {
                "obligations_yaml": str(obligations_path),
                "obligations_yaml_sha256": sha256_file(obligations_path),
            },
            "outputs": {
                "behavioral_obligations_jsonl": str(obligations_out),
                "behavioral_obligations_jsonl_sha256": sha256_file(obligations_out),
                "sampling_report_json": str(report_path),
                "sampling_report_json_sha256": sha256_file(report_path),
            },
            "counts": {
                "obligations": len(obligations),
            },
        }
        write_manifest(manifest_path, manifest)

        console.print("[bold green]Seed layer complete.[/bold green]")
        console.print(f"- obligations_version: {obligations_version}")
        console.print(f"- obligations_count: {len(obligations)}")
        console.print(f"- wrote: {obligations_out}")
        console.print(f"- wrote: {report_path}")
        console.print(f"- wrote: {manifest_path}")
        return 0

    if args.stage == "render":
        obligations_version, obligations = load_obligations_yaml(obligations_path)

        inputs = load_render_inputs(config_dir=Path("configs"))
        base_scenarios = render_base_scenarios(
            obligations=obligations,
            inputs=inputs,
            cfg=RenderConfig(seed=int(args.seed), per_obligation=int(args.per_obligation)),
        )

        seen: set[str] = set()
        deduped: list[dict] = []

        for s in base_scenarios:
            h = prompt_hash(s["prompt"])
            s["prompt_hash"] = h
            if h in seen:
                continue
            seen.add(h)
            deduped.append(s)

        out_path = intermediate_dir / "base_scenarios.jsonl"
        raw_out = intermediate_dir / "base_scenarios.jsonl"
        dedup_out = intermediate_dir / "base_scenarios_deduped.jsonl"
        write_jsonl(out_path, base_scenarios)
        write_jsonl(raw_out, base_scenarios)
        write_jsonl(dedup_out, deduped)

        report = build_render_report(
            obligations_version=obligations_version,
            base_scenarios=base_scenarios,
            deduped_scenarios=deduped,
        )
        report["generated_at"] = datetime.now(timezone.utc).isoformat()
        report["dataset_version"] = args.dataset_version
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

        manifest = {
            "dataset_version": args.dataset_version,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "stage": "render",
            "inputs": {
                "obligations_yaml": str(obligations_path),
                "obligations_yaml_sha256": sha256_file(obligations_path),
                "seed": int(args.seed),
                "per_obligation": int(args.per_obligation),
            },
            "outputs": {
                "base_scenarios_jsonl": str(raw_out),
                "base_scenarios_jsonl_sha256": sha256_file(raw_out),
                "base_scenarios_deduped_jsonl": str(dedup_out),
                "base_scenarios_deduped_jsonl_sha256": sha256_file(dedup_out),
                "sampling_report_json": str(report_path),
                "sampling_report_json_sha256": sha256_file(report_path),
            },
            "counts": {
                "base_scenarios_raw": len(base_scenarios),
                "base_scenarios_deduped": len(deduped),
            },
        }
        write_manifest(manifest_path, manifest)

        console.print("[bold green]Render layer complete.[/bold green]")
        console.print(f"- base_scenarios_raw: {len(base_scenarios)}")
        console.print(f"- base_scenarios_deduped: {len(deduped)}")
        console.print(f"- wrote: {raw_out}")
        console.print(f"- wrote: {dedup_out}")
        console.print(f"- wrote: {report_path}")
        console.print(f"- wrote: {manifest_path}")

        return 0

    if args.stage == "perturb":
        # read deduped base scenarios
        base_in = intermediate_dir / "base_scenarios_deduped.jsonl"
        if not base_in.exists():
            console.print(f"[red]Missing input:[/red] {base_in} (run --stage render first)")
            return 2

        base_scenarios = list(read_jsonl(base_in))
        catalog = load_mutation_catalog(Path(args.mutations))

        mutated = apply_mutations(
            base_scenarios=base_scenarios,
            catalog=catalog,
            seed=int(args.seed),
            k_per_base=int(args.k_per_base),
            coverage=args.coverage,
        )

        out_path = intermediate_dir / "mutated_candidates.jsonl"
        write_jsonl(out_path, mutated)

        # Report
        report = build_perturb_report(
            mutation_catalog_version=catalog.version,
            mutated_candidates=mutated,
        )
        report["generated_at"] = datetime.now(timezone.utc).isoformat()
        report["dataset_version"] = args.dataset_version
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

        # Manifest
        manifest = {
            "dataset_version": args.dataset_version,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "stage": "perturb",
            "inputs": {
                "base_scenarios_deduped_jsonl": str(base_in),
                "base_scenarios_deduped_jsonl_sha256": sha256_file(base_in),
                "mutations_yaml": str(Path(args.mutations)),
                "mutations_yaml_sha256": sha256_file(Path(args.mutations)),
                "seed": int(args.seed),
                "k_per_base": int(args.k_per_base),
                "coverage": args.coverage,
            },
            "outputs": {
                "mutated_candidates_jsonl": str(out_path),
                "mutated_candidates_jsonl_sha256": sha256_file(out_path),
                "sampling_report_json": str(report_path),
                "sampling_report_json_sha256": sha256_file(report_path),
            },
            "counts": {
                "base_scenarios_in": len(base_scenarios),
                "mutated_candidates": len(mutated),
            },
        }
        write_manifest(manifest_path, manifest)

        console.print("[bold green]Perturbation layer complete.[/bold green]")
        console.print(f"- base_scenarios_in: {len(base_scenarios)}")
        console.print(f"- mutated_candidates: {len(mutated)}")
        console.print(f"- coverage: {args.coverage}")
        console.print(f"- wrote: {out_path}")
        console.print(f"- wrote: {report_path}")
        console.print(f"- wrote: {manifest_path}")

        return 0
    
    if args.stage == "validate":
        obligations_version, obligations = load_obligations_yaml(Path(args.obligations))
        ob_index = ObligationIndex.from_list(obligations)

        cand_in = intermediate_dir / "mutated_candidates.jsonl"
        if not cand_in.exists():
            console.print(f"[red]Missing input:[/red] {cand_in} (run --stage perturb first)")
            return 2

        candidates = list(read_jsonl(cand_in))
        accepted, rejections = validate_candidates(
            candidates=candidates,
            cfg=ValidateConfig(),
        )

        accepted = enrich_with_obligations(
            scenarios=accepted,
            ob_index=ob_index,
            inject_constraints_into_prompt=bool(args.inject_constraints_into_prompt),
        )

        rej_out = intermediate_dir / "rejections.jsonl"
        scenarios_out = final_dir / "scenarios.jsonl"
        write_jsonl(rej_out, rejections)
        write_jsonl(scenarios_out, accepted)

        report = build_validate_report(accepted=accepted, rejections=rejections)
        report["generated_at"] = datetime.now(timezone.utc).isoformat()
        report["dataset_version"] = args.dataset_version
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

        manifest = {
            "dataset_version": args.dataset_version,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "stage": "validate",
            "inputs": {
                "mutated_candidates_jsonl": str(cand_in),
                "mutated_candidates_jsonl_sha256": sha256_file(cand_in),
                "obligations_yaml": str(Path(args.obligations)),
                "obligations_yaml_sha256": sha256_file(Path(args.obligations)),
                "obligations_version": obligations_version,
                "inject_constraints_into_prompt": bool(args.inject_constraints_into_prompt),
            },
            "outputs": {
                "rejections_jsonl": str(rej_out),
                "rejections_jsonl_sha256": sha256_file(rej_out),
                "scenarios_jsonl": str(scenarios_out),
                "scenarios_jsonl_sha256": sha256_file(scenarios_out),
                "sampling_report_json": str(report_path),
                "sampling_report_json_sha256": sha256_file(report_path),
            },
            "counts": {
                "candidates_in": len(candidates),
                "accepted": len(accepted),
                "rejected": len(rejections),
            },
        }
        write_manifest(manifest_path, manifest)

        console.print("[bold green]Validation gate complete.[/bold green]")
        console.print(f"- candidates_in: {len(candidates)}")
        console.print(f"- accepted: {len(accepted)}")
        console.print(f"- rejected: {len(rejections)}")
        console.print(f"- wrote: {scenarios_out}")
        console.print(f"- wrote: {rej_out}")
        console.print(f"- wrote: {report_path}")
        console.print(f"- wrote: {manifest_path}")
        return 0

    if args.stage == "infer":
        scenarios_in = final_dir / "scenarios.jsonl"
        if not scenarios_in.exists():
            console.print(f"[red]Missing input:[/red] {scenarios_in}")
            return 2

        scenarios = list(read_jsonl(scenarios_in))

        if args.provider == "openrouter":
            client = OpenRouterChatClient(model_id=args.model_id)
        else:
            client = MockChatClient(model_id=args.model_id, provider=args.provider)

        cfg = InferConfig(
            model_id=args.model_id,
            provider=args.provider,
            temperature=float(args.temperature),
            max_tokens=int(args.max_tokens),
        )

        responses = run_inference(
            scenarios=scenarios,
            client=client,
            cfg=cfg,
        )

        out_path = final_dir / "candidate_responses.jsonl"
        write_jsonl(out_path, responses)

        console.print("[bold green]Inference complete.[/bold green]")
        console.print(f"- provider: {args.provider}")
        console.print(f"- model_id: {args.model_id}")
        console.print(f"- scenarios_in: {len(scenarios)}")
        console.print(f"- responses_out: {len(responses)}")
        console.print(f"- wrote: {out_path}")
        return 0


    console.print(f"[red]Unsupported stage:[/red] {args.stage}")
    return 2


def main() -> None:
    parser = argparse.ArgumentParser(prog="grs-scenarios")
    sub = parser.add_subparsers(dest="cmd", required=True)

    gen = sub.add_parser("generate", help="Generate artifacts for the scenario pipeline")
    gen.add_argument("--stage", choices=["seeds", "render", "perturb", "validate", "infer"], required=True)
    gen.add_argument("--seed", default="42")
    gen.add_argument("--per-obligation", default="2")
    gen.add_argument("--mutations", default="configs/mutations.yaml")
    gen.add_argument("--k-per-base", default="3")
    gen.add_argument("--coverage", choices=["random", "per_family"], default="random")
    gen.add_argument("--inject-constraints-into-prompt", action="store_true")
    gen.add_argument("--model-id", default="mock-model")
    gen.add_argument("--provider", default="mock")
    gen.add_argument("--temperature", default="0.2")
    gen.add_argument("--max-tokens", default="500")
    gen.add_argument("--dataset-version", default="grs_scenarios_v0.1")
    gen.add_argument("--obligations", default="configs/obligations.yaml")
    gen.add_argument("--out-dir", default="datasets")
    gen.set_defaults(func=_cmd_generate)

    args = parser.parse_args()
    rc = args.func(args)
    raise SystemExit(rc)
