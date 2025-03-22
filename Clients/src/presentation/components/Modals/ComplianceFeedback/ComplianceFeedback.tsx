import { Box, Typography, Button, useTheme, Dialog, Stack } from "@mui/material";
import React, { useCallback, useContext, useMemo, useState } from "react";
import RichTextEditor from "../../../components/RichTextEditor/index";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import Alert, { AlertProps } from "../../../components/Alert";
import { store } from "../../../../application/redux/store";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { ENV_VARs } from "../../../../../env.vars";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { Control } from "../../../../domain/Control";
import createUppy from "../../../../application/tools/createUppy";
import { useSelector } from "react-redux";
import { FileData } from "../../../../domain/File";
import Uppy from "@uppy/core";

interface AuditorFeedbackProps {
	activeSection?: string;
	feedback: string | undefined;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	control: Control;
	files: string[];
	subControlId: number;
	onFilesChange?: (files: FileData[]) => void;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({
	activeSection,
	feedback,
	onChange,
	control,
	files,
	subControlId,
	onFilesChange
}) => {


	const initialEvidenceFiles = files
		? files.reduce((acc: FileData[], file) => {
			try {
				acc.push(JSON.parse(file));
			} catch (error) {
				console.error("Failed to parse evidence file:", error);
			}
			return acc;
		}, [])
		: [];

	const theme = useTheme();
	const [isFileUploadOpen, setIsFileUploadOpen] = useState<boolean>(false);
	const authToken = useSelector((state: any) => state.auth.authToken);
	const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>(initialEvidenceFiles);
	const [alert, setAlert] = useState<AlertProps | null>(null);
	const { userId, currentProjectId } = useContext(VerifyWiseContext);

	const handleChangeEvidenceFiles = useCallback((files: FileData[]) => {
		setEvidenceFiles(files);
	}, []);

	// const createUppyProps = useMemo(
	// 	() => ({
	// 		onChangeFiles: handleChangeEvidenceFiles,
	// 		allowedMetaFields: ["question_id", "user_id", "project_id", "delete"],
	// 		meta: {
	// 			question_id: control.id,
	// 			user_id: userId,
	// 			project_id: currentProjectId,
	// 			delete: "[]",
	// 		},
	// 		routeUrl: "files",
	// 		authToken,
	// 	}),
	// 	[control.id, userId, currentProjectId, handleChangeEvidenceFiles, authToken]
	// );

	// console.log(control);
	// console.log(control.id)
	// const [uppy] = useState(createUppy(createUppyProps));
	const [uppy] = useState(() => new Uppy());

	const handleContentChange = (content: string) => {
		onChange({
			target: {
				value:
					" " +
					content
						.replace(/^<p>/, "")
						.replace(/<\/p>$/, "")
						.trim(),
			},
		} as React.ChangeEvent<HTMLInputElement>);
	};

	const handleRemoveFile = async (fileId: string) => {
		const type = activeSection === "Evidence" ? "evidence" : "feedback";
		const state = store.getState();
		const authToken = state.auth.authToken;

		const formData = new FormData();
		const fileIdNumber = parseInt(fileId);
		if (isNaN(fileIdNumber)) {
			handleAlert({
				variant: "error",
				body: "Invalid file ID",
				setAlert,
			});
			return;
		}
		formData.append("delete", JSON.stringify([fileIdNumber]));
		formData.append(`${type}_files_${subControlId}`, control.id?.toString() || "");
		formData.append("user_id", userId);
		if (currentProjectId) {
			formData.append("project_id", currentProjectId);
		}
		const newEvidenceFiles = evidenceFiles.filter(
			(file) => file.id !== fileId
		);
		setEvidenceFiles(newEvidenceFiles);
		onFilesChange?.(newEvidenceFiles);
		handleAlert({
			variant: "success",
			body: "File deleted successfully",
			setAlert,
		});

		// try {
		// 	const response = await apiServices.post(
		// 		`${ENV_VARs.URL}/files`,
		// 		formData,
		// 		{
		// 			headers: {
		// 				Authorization: `Bearer ${authToken}`,
		// 				"Content-Type": "multipart/form-data",
		// 			},
		// 		}
		// 	);

		// 	if (response.status === 201 && response.data) {
		// 		const newEvidenceFiles = evidenceFiles.filter(
		// 			(file) => file.id !== fileId
		// 		);
		// 		setEvidenceFiles(newEvidenceFiles);

		// 		handleAlert({
		// 			variant: "success",
		// 			body: "File deleted successfully",
		// 			setAlert,
		// 		});
		// 	} else {
		// 		handleAlert({
		// 			variant: "error",
		// 			body: `Unexpected response status: ${response.status}. Please try again.`,
		// 			setAlert,
		// 		});
		// 	}
		// } catch (error) {
		// 	console.error("Error deleting file:", error);
		// 	handleAlert({
		// 		variant: "error",
		// 		body: "Failed to delete file. Please try again.",
		// 		setAlert,
		// 	});
		// }
	};

	const closeFileUploadModal = () => {
		const uppyFiles = uppy.getFiles();
		const newEvidenceFiles = uppyFiles.map(file => ({
			id: file.id,
			fileName: file.name || '',
			size: file.size,
			type: file.type
		}));
		const combinedFiles = [...evidenceFiles, ...newEvidenceFiles];
		setEvidenceFiles(combinedFiles);
		onFilesChange?.(combinedFiles);
		setIsFileUploadOpen(false);
	};

	return (
		<Box sx={{ width: "100%", padding: 2 }}>
			{activeSection && (
				<>
					<Typography sx={{ mb: 2 }}>
						{activeSection === "Evidence" ? "Evidence:" : "Feedback:"}
					</Typography>

					<RichTextEditor
						initialContent={feedback}
						onContentChange={handleContentChange}
					/>
				</>
			)}

			<Stack direction="row" spacing={2}>
				<Button
					variant="contained"
					sx={{
						mt: 2,
						borderRadius: 2,
						width: 155,
						height: 25,
						fontSize: 11,
						border: "1px solid #D0D5DD",
						backgroundColor: "white",
						color: "#344054",
					}}
					disableRipple={
						theme.components?.MuiButton?.defaultProps?.disableRipple
					}
					onClick={() => setIsFileUploadOpen(true)}
				>
					Add/Remove evidence
				</Button>
				<Typography
					sx={{
						fontSize: 11,
						color: "#344054",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
						margin: "auto",
						textWrap: "wrap",
					}}
				>
					{`${evidenceFiles.length || 0} evidence files attached`}
				</Typography>
			</Stack>
			<Dialog
				open={isFileUploadOpen}
				onClose={closeFileUploadModal}
			>
				<UppyUploadFile
					uppy={uppy}
					files={evidenceFiles}
					onClose={closeFileUploadModal}
					onRemoveFile={handleRemoveFile}
				/>
			</Dialog>
			{alert && (
				<Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
			)}
		</Box>
	);
};

export default AuditorFeedback;
