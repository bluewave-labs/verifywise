import json
import gzip
import typing
from fastapi import FastAPI, UploadFile
from crud.bias_and_fairness import upload_model, upload_data, insert_metrics
from utils.run_bias_and_fairness_check import analyze_fairness
from database.db import get_db
from database.redis import set_job_status

@typing.no_type_check
async def process_files(
    job_id: int,
    model: dict[str, typing.Union[bytes, str]],
    data: dict[str, typing.Union[bytes, str]],
    target_column: str,
    sensitive_column: str,
):
    try:
        async with get_db() as db:
            transaction = await db.begin()

            if not model["filename"] or not data["filename"]:
                raise ValueError("model or data file name is empty")
            model_filename = model["filename"].replace(".gz", "")
            data_filename = data["filename"].replace(".gz", "")

            if not model["content"] or not data["content"]:
                raise ValueError("model or data file is empty")

            model_bytes = model["content"]
            data_bytes  = data["content"]

            model_content = (
                gzip.decompress(model_bytes) if model["filename"].endswith(".gz") else model_bytes
            )
            data_content = (
                gzip.decompress(data_bytes) if data["filename"].endswith(".gz") else data_bytes
            )

            upload_model_record = await upload_model(content=model_content, name=model_filename, db=db)

            if not upload_model_record:
                raise Exception("failed to upload model file")

            upload_data_record = await upload_data(
                content=data_content,
                name=data_filename,
                target_column=target_column,
                sensitive_column=sensitive_column,
                model_id=upload_model_record.id,
                db=db
            )

            if not upload_data_record:
                raise Exception("failed to upload data file")
            result = analyze_fairness(
                model_content=model_content,
                data_content=data_content,
                target_column=target_column,
                sensitive_column=sensitive_column
            )

            metrics = await insert_metrics(json.dumps(result), upload_data_record.id, db)
            if not metrics:
                raise Exception("failed to insert metrics")

            await transaction.commit()
            status = {
                "status": "Completed",
                "model_filename": model_filename,
                "data_filename": data_filename,
                "metrics_id": metrics.id,
                "metrics": result
            }
    except Exception as e:
        status = {
            "status": "Failed", 
            "error": str(e), 
            "model_filename": locals().get("model_filename", "***"),
            "data_filename": locals().get("data_filename", "***")
        }

    await set_job_status(job_id, status)
