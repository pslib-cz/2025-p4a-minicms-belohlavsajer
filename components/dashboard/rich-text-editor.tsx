"use client";

import { useEffect, useRef, useState } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { isValidImageSource } from "@/lib/utils";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
};

const EMPTY_DOCUMENT = "<p></p>";

type ToolbarButtonProps = {
    label: string;
    title: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
};

type ImageAttrs = {
    src: string;
    alt?: string | null;
    title?: string | null;
};

type UploadImageResponse = {
    src: string;
    alt?: string | null;
    error?: string;
};

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        guideImage: {
            setGuideImage: (attrs: ImageAttrs) => ReturnType;
        };
    }
}

const GuideImage = Node.create({
    name: "image",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [{ tag: "img[src]" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["img", mergeAttributes(HTMLAttributes)];
    },

    addCommands() {
        return {
            setGuideImage:
                (attrs) =>
                ({ commands }) =>
                    commands.insertContent([
                        {
                            type: this.name,
                            attrs,
                        },
                        {
                            type: "paragraph",
                        },
                    ]),
        };
    },
});

function normalizeEditorValue(value: string) {
    return value.trim() ? value : EMPTY_DOCUMENT;
}

function ToolbarButton({
    label,
    title,
    onClick,
    disabled = false,
    active = false,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            className={`wysiwyg-toolbar-button${active ? " is-active" : ""}`}
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            aria-pressed={active}
        >
            {label}
        </button>
    );
}

function canRun(editor: Editor | null, command: (editor: Editor) => boolean) {
    return editor ? command(editor) : false;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    const normalizedValue = normalizeEditorValue(value);
    const [imagePanelOpen, setImagePanelOpen] = useState(false);
    const [imageSource, setImageSource] = useState("");
    const [imageAlt, setImageAlt] = useState("");
    const [imageError, setImageError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<
        string | null
    >(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const trimmedImageSource = imageSource.trim();
    const imagePreview =
        selectedFilePreviewUrl ||
        (trimmedImageSource && isValidImageSource(trimmedImageSource)
            ? trimmedImageSource
            : null);
    const editor = useEditor({
        extensions: [StarterKit, GuideImage],
        content: normalizedValue,
        editorProps: {
            attributes: {
                class: "wysiwyg-surface",
            },
        },
        onUpdate({ editor: updatedEditor }) {
            onChange(updatedEditor.isEmpty ? "" : updatedEditor.getHTML());
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        if (editor.getHTML() !== normalizedValue) {
            editor.commands.setContent(normalizedValue, { emitUpdate: false });
        }
    }, [editor, normalizedValue]);

    useEffect(() => {
        if (!selectedFile) {
            setSelectedFilePreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setSelectedFilePreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile]);

    function resetImageForm() {
        setImageSource("");
        setImageAlt("");
        setImageError(null);
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function insertImage(attrs: ImageAttrs) {
        if (!editor) {
            return false;
        }

        return editor.chain().focus().setGuideImage(attrs).run();
    }

    function toggleImagePanel() {
        setImagePanelOpen((prev) => {
            if (prev) {
                resetImageForm();
            }

            return !prev;
        });
    }

    function submitImage() {
        if (!editor) {
            return;
        }

        const trimmedSource = imageSource.trim();
        const trimmedAlt = imageAlt.trim();

        if (!trimmedSource) {
            setImageError("Doplň URL nebo cestu k obrázku.");
            return;
        }

        if (!isValidImageSource(trimmedSource)) {
            setImageError(
                "Použij `https://...`, `http://...` nebo relativní cestu jako `/covers/guide.png`.",
            );
            return;
        }

        insertImage({
            src: trimmedSource,
            alt: trimmedAlt || null,
            title: trimmedAlt || null,
        });

        resetImageForm();
        setImagePanelOpen(false);
    }

    async function uploadImageFile() {
        if (!selectedFile) {
            setImageError("Vyber obrázek, který chceš nahrát.");
            return;
        }

        setUploadingImage(true);
        setImageError(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        if (imageAlt.trim()) {
            formData.append("alt", imageAlt.trim());
        }

        try {
            const response = await fetch("/api/uploads/guides", {
                method: "POST",
                body: formData,
            });
            const data = (await response.json()) as UploadImageResponse;
            const fallbackAlt = imageAlt.trim() || null;

            if (!response.ok || !data.src) {
                throw new Error(data.error ?? "Nahrání obrázku selhalo.");
            }

            insertImage({
                src: data.src,
                alt: data.alt ?? fallbackAlt,
                title: data.alt ?? fallbackAlt,
            });

            resetImageForm();
            setImagePanelOpen(false);
        } catch (error) {
            setImageError(
                error instanceof Error
                    ? error.message
                    : "Nahrání obrázku selhalo.",
            );
        } finally {
            setUploadingImage(false);
        }
    }

    return (
        <div className="wysiwyg-shell">
            <div
                className="wysiwyg-toolbar"
                role="toolbar"
                aria-label="Nástroje formátování obsahu guideu"
            >
                <div className="wysiwyg-toolbar-group">
                    <ToolbarButton
                        label="P"
                        title="Odstavec"
                        onClick={() => {
                            editor?.chain().focus().setParagraph().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().setParagraph().run(),
                        )}
                        active={editor?.isActive("paragraph")}
                    />
                    <ToolbarButton
                        label="H2"
                        title="Nadpis 2"
                        onClick={() => {
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run(),
                        )}
                        active={editor?.isActive("heading", { level: 2 })}
                    />
                    <ToolbarButton
                        label="H3"
                        title="Nadpis 3"
                        onClick={() => {
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run(),
                        )}
                        active={editor?.isActive("heading", { level: 3 })}
                    />
                </div>

                <div className="wysiwyg-toolbar-group">
                    <ToolbarButton
                        label="B"
                        title="Tučně"
                        onClick={() => {
                            editor?.chain().focus().toggleBold().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().toggleBold().run(),
                        )}
                        active={editor?.isActive("bold")}
                    />
                    <ToolbarButton
                        label="I"
                        title="Kurzíva"
                        onClick={() => {
                            editor?.chain().focus().toggleItalic().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().toggleItalic().run(),
                        )}
                        active={editor?.isActive("italic")}
                    />
                    <ToolbarButton
                        label="S"
                        title="Přeškrtnutí"
                        onClick={() => {
                            editor?.chain().focus().toggleStrike().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().toggleStrike().run(),
                        )}
                        active={editor?.isActive("strike")}
                    />
                </div>

                <div className="wysiwyg-toolbar-group">
                    <ToolbarButton
                        label="UL"
                        title="Odrážkový seznam"
                        onClick={() => {
                            editor?.chain().focus().toggleBulletList().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleBulletList()
                                .run(),
                        )}
                        active={editor?.isActive("bulletList")}
                    />
                    <ToolbarButton
                        label="OL"
                        title="Číslovaný seznam"
                        onClick={() => {
                            editor?.chain().focus().toggleOrderedList().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleOrderedList()
                                .run(),
                        )}
                        active={editor?.isActive("orderedList")}
                    />
                    <ToolbarButton
                        label="“”"
                        title="Citace"
                        onClick={() => {
                            editor?.chain().focus().toggleBlockquote().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleBlockquote()
                                .run(),
                        )}
                        active={editor?.isActive("blockquote")}
                    />
                    <ToolbarButton
                        label="{ }"
                        title="Code blok"
                        onClick={() => {
                            editor?.chain().focus().toggleCodeBlock().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor
                                .can()
                                .chain()
                                .focus()
                                .toggleCodeBlock()
                                .run(),
                        )}
                        active={editor?.isActive("codeBlock")}
                    />
                    <ToolbarButton
                        label="IMG"
                        title="Vložit obrázek"
                        onClick={toggleImagePanel}
                        disabled={!editor}
                        active={imagePanelOpen}
                    />
                </div>

                <div className="wysiwyg-toolbar-group">
                    <ToolbarButton
                        label="Clear"
                        title="Vyčistit formátování"
                        onClick={() => {
                            editor
                                ?.chain()
                                .focus()
                                .clearNodes()
                                .unsetAllMarks()
                                .run();
                        }}
                        disabled={!editor}
                    />
                    <ToolbarButton
                        label="Undo"
                        title="Zpět"
                        onClick={() => {
                            editor?.chain().focus().undo().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().undo().run(),
                        )}
                    />
                    <ToolbarButton
                        label="Redo"
                        title="Znovu"
                        onClick={() => {
                            editor?.chain().focus().redo().run();
                        }}
                        disabled={!canRun(editor, (currentEditor) =>
                            currentEditor.can().chain().focus().redo().run(),
                        )}
                    />
                </div>
            </div>

            {imagePanelOpen ? (
                <div
                    className="wysiwyg-image-panel"
                    role="group"
                    aria-label="Vložení obrázku do guideu"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            submitImage();
                        }
                    }}
                >
                    <div className="wysiwyg-image-layout">
                        <div className="wysiwyg-image-fields">
                            <label className="wysiwyg-image-field">
                                <span>Obrázek</span>
                                <input
                                    type="text"
                                    value={imageSource}
                                    onChange={(event) => {
                                        setImageSource(event.target.value);
                                        setImageError(null);
                                    }}
                                    placeholder="https://... nebo /covers/guide.png"
                                />
                            </label>
                            <label className="wysiwyg-image-field">
                                <span>Alt text</span>
                                <input
                                    type="text"
                                    value={imageAlt}
                                    onChange={(event) =>
                                        setImageAlt(event.target.value)
                                    }
                                    placeholder="Krátký popis obrázku"
                                />
                            </label>
                        </div>
                        <div className="wysiwyg-image-side">
                            <label className="wysiwyg-image-field">
                                <span>Nahrát soubor</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                    onChange={(event) => {
                                        setSelectedFile(
                                            event.target.files?.[0] ?? null,
                                        );
                                        setImageError(null);
                                    }}
                                />
                            </label>
                            {selectedFile ? (
                                <p className="wysiwyg-selected-file">
                                    Vybraný soubor: {selectedFile.name}
                                </p>
                            ) : null}
                            {imagePreview ? (
                                <div className="wysiwyg-image-preview">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePreview}
                                        alt={imageAlt.trim() || "Preview obrázku"}
                                    />
                                    <span className="wysiwyg-selected-file">
                                        Preview:{" "}
                                        {selectedFile
                                            ? selectedFile.name
                                            : trimmedImageSource}
                                    </span>
                                </div>
                            ) : null}
                            <div className="wysiwyg-image-actions">
                                <button
                                    type="button"
                                    className="wysiwyg-toolbar-button"
                                    onClick={submitImage}
                                    disabled={uploadingImage}
                                >
                                    Vložit z URL
                                </button>
                                <button
                                    type="button"
                                    className="wysiwyg-toolbar-button"
                                    onClick={() => void uploadImageFile()}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage
                                        ? "Nahrávám..."
                                        : "Nahrát soubor"}
                                </button>
                                <button
                                    type="button"
                                    className="wysiwyg-toolbar-button"
                                    onClick={toggleImagePanel}
                                    disabled={uploadingImage}
                                >
                                    Zrušit
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="wysiwyg-hint wysiwyg-image-hint">
                        Použij relativní cestu z `public`, například
                        ` /covers/starter-camp.svg`, nebo externí `https://`
                        adresu. Upload přijímá JPG, PNG, WebP, GIF a AVIF do
                        5 MB.
                    </p>
                    {imageError ? (
                        <p className="wysiwyg-image-error">{imageError}</p>
                    ) : null}
                </div>
            ) : null}

            <p className="wysiwyg-hint">
                Použij toolbar pro nadpisy, zvýraznění, seznamy, citace, code
                bloky a vložení obrázku. Titulek guideu se spravuje zvlášť.
            </p>

            <EditorContent editor={editor} className="wysiwyg-editor" />
        </div>
    );
}
