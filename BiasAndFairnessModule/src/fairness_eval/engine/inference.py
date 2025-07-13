def generate_llm_responses(model_pipeline, prompts, max_new_tokens=50):
    all_outputs = []

    for i in range(0, len(prompts), 4):  # batching for speed/memory
        batch = prompts[i:i+4]
        outputs = model_pipeline(batch, max_new_tokens=max_new_tokens)

        # Each `output` is a list of dicts, one per prompt.
        for output in outputs:
            if isinstance(output, list):
                all_outputs.append(output[0]["generated_text"])  # from list of one dict
            else:
                all_outputs.append(output["generated_text"])  # single dict

    return all_outputs

