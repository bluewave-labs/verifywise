import React, { useState, useEffect, useRef } from "react";
import { createPlatePlugin, useEditorRef, useNodePath } from "platejs/react";
import { useFocused, useSelected } from "platejs/react";
import { store } from "../../../application/redux/store";
import { Box, IconButton, Tooltip, Popover } from "@mui/material";
import Field from "../Inputs/Field";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  GripVertical,
  Type,
  Download,
} from "lucide-react";

interface ImageElementProps {
  attributes: any;
  children: React.ReactNode;
  element: {
    url?: string;
    src?: string;
    alt?: string;
    width?: number | string;
    align?: "left" | "center" | "right";
    caption?: string;
  };
}

export const ImageElement: React.FC<ImageElementProps> = (props) => {
  const { attributes, children, element } = props;
  const editor = useEditorRef();
  const selected = useSelected();
  const focused = useFocused();
  const path = useNodePath(element as any);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState<number | string>(element.width || "100%");
  const [caption, setCaption] = useState(element.caption || "");
  const [captionAnchor, setCaptionAnchor] = useState<HTMLElement | null>(null);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Store path in ref so it's accessible in event handlers
  const pathRef = useRef(path);
  pathRef.current = path;

  const src = element.url || element.src || "";
  const align = element.align || "center";

  // Check if this is an API URL that needs authentication
  const isApiUrl = src.startsWith("/api/") || src.includes("/api/file-manager/");

  useEffect(() => {
    if (!isApiUrl || !src) {
      setBlobUrl(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchImage = async () => {
      setLoading(true);
      setError(false);

      try {
        const token = store.getState().auth.authToken;
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && isMounted) {
          console.error("Failed to fetch image:", err);
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      controller.abort();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, isApiUrl]);

  // Use blob URL for API images, original src for external images
  const imageSrc = isApiUrl ? blobUrl : src;

  // Update element properties using Plate's API
  const updateElement = (updates: Partial<typeof element>) => {
    try {
      // Ensure path is valid (not empty/root)
      if (pathRef.current && pathRef.current.length > 0) {
        editor.tf.setNodes(updates, { at: pathRef.current });
      }
    } catch (e) {
      console.error("Failed to update image element:", e);
    }
  };

  // Store width in ref for access in event handlers (avoids stale closure)
  const widthRef = useRef(width);
  widthRef.current = width;

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = direction === "right"
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX;
      const newWidth = Math.max(100, Math.min(startWidth + deltaX, 800));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save width to element using ref to get current value
      // Ensure path is valid (not empty/root)
      if (pathRef.current && pathRef.current.length > 0) {
        editor.tf.setNodes({ width: widthRef.current }, { at: pathRef.current });
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle alignment
  const handleAlign = (newAlign: "left" | "center" | "right") => {
    updateElement({ align: newAlign });
  };

  // Handle delete using Plate's API
  const handleDelete = () => {
    try {
      // Ensure path is valid (not empty/root)
      if (pathRef.current && pathRef.current.length > 0) {
        editor.tf.removeNodes({ at: pathRef.current });
      }
    } catch (e) {
      console.error("Failed to delete image:", e);
    }
  };

  // Handle caption
  const handleCaptionClick = (e: React.MouseEvent<HTMLElement>) => {
    setCaptionAnchor(e.currentTarget);
  };

  const handleCaptionClose = () => {
    setCaptionAnchor(null);
    updateElement({ caption });
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const url = imageSrc || src;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = element.alt || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("Failed to download image:", e);
    }
  };


  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
    position: "relative",
    margin: "12px 0",
  };

  const imageWrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: typeof width === "number" ? `${width}px` : width,
    maxWidth: "100%",
  };

  const toolbarStyle: React.CSSProperties = {
    position: "absolute",
    top: "-40px",
    right: "0",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "4px 8px",
    backgroundColor: "#fff",
    border: "1px solid #d0d5dd",
    borderRadius: "6px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: 10,
  };

  const showControls = selected || isToolbarHovered;

  const resizeHandleStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "8px",
    height: "40px",
    backgroundColor: showControls ? "#3182ce" : "transparent",
    borderRadius: "4px",
    cursor: "ew-resize",
    opacity: showControls ? 1 : 0,
    transition: "opacity 0.2s",
  };

  const buttonStyle = {
    padding: "4px",
    borderRadius: "4px",
    color: "#344054",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
  };

  return (
    <div {...attributes} contentEditable={false}>
      <div style={containerStyle}>
        <div ref={containerRef} style={imageWrapperStyle}>
          {/* Floating toolbar when selected or hovered */}
          {(selected || isToolbarHovered) && !loading && !error && (
            <div
              style={toolbarStyle}
              onMouseEnter={() => setIsToolbarHovered(true)}
              onMouseLeave={() => setIsToolbarHovered(false)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Tooltip title="Align left">
                <IconButton
                  size="small"
                  sx={{
                    ...buttonStyle,
                    backgroundColor: align === "left" ? "#e5e7eb" : "transparent",
                  }}
                  onClick={() => handleAlign("left")}
                >
                  <AlignLeft size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Align center">
                <IconButton
                  size="small"
                  sx={{
                    ...buttonStyle,
                    backgroundColor: align === "center" ? "#e5e7eb" : "transparent",
                  }}
                  onClick={() => handleAlign("center")}
                >
                  <AlignCenter size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Align right">
                <IconButton
                  size="small"
                  sx={{
                    ...buttonStyle,
                    backgroundColor: align === "right" ? "#e5e7eb" : "transparent",
                  }}
                  onClick={() => handleAlign("right")}
                >
                  <AlignRight size={14} />
                </IconButton>
              </Tooltip>

              <Box sx={{ width: "1px", height: "16px", backgroundColor: "#d0d5dd", mx: 0.5 }} />

              <Tooltip title="Add caption">
                <IconButton size="small" sx={buttonStyle} onClick={handleCaptionClick}>
                  <Type size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" sx={buttonStyle} onClick={handleDownload}>
                  <Download size={14} />
                </IconButton>
              </Tooltip>

              <Box sx={{ width: "1px", height: "16px", backgroundColor: "#d0d5dd", mx: 0.5 }} />

              <Tooltip title="Delete image">
                <IconButton
                  size="small"
                  sx={{ ...buttonStyle, color: "#dc2626", "&:hover": { backgroundColor: "#fef2f2" } }}
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                </IconButton>
              </Tooltip>
            </div>
          )}

          {/* Left resize handle */}
          {(selected || isToolbarHovered) && (
            <div
              style={{ ...resizeHandleStyle, left: "-12px" }}
              onMouseDown={(e) => handleResizeStart(e, "left")}
            >
              <GripVertical size={8} style={{ margin: "auto", color: "#fff" }} />
            </div>
          )}

          {/* Image content */}
          {loading ? (
            <div
              style={{
                background: "#f0f0f0",
                color: "#666",
                padding: "16px 24px",
                borderRadius: "6px",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              Loading image...
            </div>
          ) : error || (isApiUrl && !blobUrl) ? (
            <div
              style={{
                background: "#f56565",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              Image not found
            </div>
          ) : (
            <img
              src={imageSrc || ""}
              alt={element.alt || ""}
              style={{
                width: "100%",
                borderRadius: "8px",
                boxShadow: selected && focused ? "0 0 0 2px #3182ce" : "none",
                cursor: isResizing ? "ew-resize" : "default",
              }}
              onError={() => setError(true)}
              draggable={false}
            />
          )}

          {/* Right resize handle */}
          {(selected || isToolbarHovered) && (
            <div
              style={{ ...resizeHandleStyle, right: "-12px" }}
              onMouseDown={(e) => handleResizeStart(e, "right")}
            >
              <GripVertical size={8} style={{ margin: "auto", color: "#fff" }} />
            </div>
          )}
        </div>

        {/* Caption display */}
        {element.caption && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "0.85rem",
              color: "#667085",
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: typeof width === "number" ? `${width}px` : width,
            }}
          >
            {element.caption}
          </div>
        )}
      </div>

      {/* Caption popover */}
      <Popover
        open={Boolean(captionAnchor)}
        anchorEl={captionAnchor}
        onClose={handleCaptionClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Field
            label="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                handleCaptionClose();
              }
            }}
            placeholder="Enter image caption..."
            width="100%"
          />
        </Box>
      </Popover>

      {children}
    </div>
  );
};

export const imagePlugin = createPlatePlugin({
  key: "image",
  node: {
    isElement: true,
    isVoid: true,
    component: ImageElement,
  },
  parsers: {
    html: {
      deserializer: {
        rules: [
          {
            validNodeName: "IMG",
          },
        ],
        parse: ({ element }) => {
          const img = element as HTMLImageElement;
          // Check both src and data-src (data-src is used to prevent browser auto-loading)
          const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
          const alt = img.getAttribute("alt") || "";
          // Try to extract width from style attribute
          const style = img.getAttribute("style") || "";
          let width: string | number = "100%";
          const widthMatch = style.match(/width:\s*(\d+)px/);
          if (widthMatch) {
            width = parseInt(widthMatch[1], 10);
          } else if (style.includes("width:")) {
            const percentMatch = style.match(/width:\s*(\d+%)/);
            if (percentMatch) {
              width = percentMatch[1];
            }
          }
          return {
            type: "image",
            url: src,
            alt,
            width,
            align: "center",
            children: [{ text: "" }],
          };
        },
      },
    },
  },
});

export const insertImage = (editor: any, url: string, alt = "") => {
  editor.tf.insertNodes({
    type: "image",
    url,
    alt,
    width: 400,
    align: "center",
    children: [{ text: "" }],
  });
};
