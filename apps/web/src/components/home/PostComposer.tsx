import { useMemo, useRef, useState } from "react";
import { postsApi, uploadToStorage } from "../../api";
import { Alert, Spinner } from "../ui/Feedback";

type Edit = {
  scale: number;
  x: number;
  y: number;
  filter: string;
  frameRatio: number;
};
type ImageItem = { file: File; url: string; width: number; height: number; edit: Edit };
const frames = [
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["3:4", 3 / 4],
  ["16:9", 16 / 9],
];
const frameIcons: Record<string, string> = {
  "1:1": "□",
  "4:5": "▯",
  "3:4": "▯",
  "16:9": "▭",
};
const filters = [
  ["Original", "none"],
  ["Warm", "sepia(.28) saturate(1.35)"],
  ["Cool", "saturate(.8) hue-rotate(12deg)"],
  ["Mono", "grayscale(1)"],
  ["Vivid", "saturate(1.7) contrast(1.08)"],
  ["Fade", "contrast(.9) brightness(1.08) saturate(.7)"],
  ["Dusk", "brightness(.82) saturate(1.15) hue-rotate(-12deg)"],
  ["Rose", "sepia(.2) saturate(1.5) hue-rotate(300deg)"],
  ["Noir", "grayscale(.8) contrast(1.3)"],
];

async function renderImage(item: ImageItem) {
  const image = new Image();
  image.src = item.url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to prepare image"));
  });
  const canvas = document.createElement("canvas");
  const ratio = item.edit.frameRatio;
  canvas.width = 1200;
  canvas.height = Math.round(canvas.width / ratio);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare image");
  context.filter = item.edit.filter;
  const scale = item.edit.scale;
  const coverScale =
    Math.max(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    ) * scale;
  const width = image.naturalWidth * coverScale;
  const height = image.naturalHeight * coverScale;
  context.drawImage(
    image,
    (canvas.width - width) / 2 + (item.edit.x / 100) * canvas.width,
    (canvas.height - height) / 2 + (item.edit.y / 100) * canvas.height,
    width,
    height,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Unable to prepare image");
  return new File([blob], item.file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

function getDragBounds(item: ImageItem | undefined) {
  if (!item) return { x: 0, y: 0 };
  const frameRatio = item.edit.frameRatio;
  const imageRatio = item.width && item.height ? item.width / item.height : 1;
  const frameWidth = 1;
  const frameHeight = 1 / frameRatio;
  const baseWidth = Math.max(frameWidth, imageRatio * frameHeight);
  const baseHeight = Math.max(frameHeight, frameWidth / imageRatio);
  const scaledWidth = baseWidth * item.edit.scale;
  const scaledHeight = baseHeight * item.edit.scale;
  return {
    x: Math.max(0, ((scaledWidth - frameWidth) / (2 * scaledWidth)) * 100),
    y: Math.max(0, ((scaledHeight - frameHeight) / (2 * scaledHeight)) * 100),
  };
}

export function PostComposer({
  token,
  onClose,
  onPublished,
}: {
  token: string;
  onClose: () => void;
  onPublished: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [caption, setCaption] = useState("");
  const [publicPost, setPublicPost] = useState(true);
  const [likesVisible, setLikesVisible] = useState(true);
  const [frameMenuOpen, setFrameMenuOpen] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "error" | "success";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const reorderIndex = useRef<number | null>(null);
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  const current = items[selected];
  const previewStyle = useMemo(
    () =>
      current
        ? {
          filter: current.edit.filter,
          transform: `scale(${current.edit.scale}) translate(${current.edit.x}%, ${current.edit.y}%)`,
        }
        : undefined,
    [current],
  );
  const panelWidth = [
    "w-full max-w-3xl",
    "w-full max-w-4xl",
    "w-full max-w-2xl",
  ][step];

  function addFiles(files: FileList | File[]) {
    const images = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 10 - items.length);
    setItems((existing) => [
      ...existing,
      ...images.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        width: 0,
        height: 0,
        edit: { scale: 1, x: 0, y: 0, filter: "none", frameRatio: 1 },
      })),
    ]);
    setMessage(null);
  }
  function updateEdit(patch: Partial<Edit>) {
    setItems((existing) =>
      existing.map((item, index) =>
        index === selected
          ? { ...item, edit: { ...item.edit, ...patch } }
          : item,
      ),
    );
  }
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (step !== 0 || !current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStart.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: current.edit.x,
      y: current.edit.y,
    };
  }
  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    updateEdit({
      x: Math.max(-100, Math.min(100, dragStart.current.x + (event.clientX - dragStart.current.clientX) / 1.5)),
      y: Math.max(-100, Math.min(100, dragStart.current.y + (event.clientY - dragStart.current.clientY) / 1.5)),
    });
  }
  function stopDrag() {
    dragStart.current = null;
    const bounds = getDragBounds(current);
    updateEdit({
      x: Math.max(-bounds.x, Math.min(bounds.x, current?.edit.x ?? 0)),
      y: Math.max(-bounds.y, Math.min(bounds.y, current?.edit.y ?? 0)),
    });
    setIsDragging(false);
  }
  function zoom(event: React.WheelEvent<HTMLDivElement>) {
    if (step !== 0 || !current) return;
    event.preventDefault();
    updateEdit({
      scale: Math.max(
        1,
        Math.min(3, current.edit.scale - event.deltaY * 0.001),
      ),
    });
  }
  function removeItem(index: number) {
    const item = items[index];
    if (item) URL.revokeObjectURL(item.url);
    setItems((existing) =>
      existing.filter((_, itemIndex) => itemIndex !== index),
    );
    setSelected((currentIndex) =>
      currentIndex > index
        ? currentIndex - 1
        : Math.min(currentIndex, Math.max(0, items.length - 2)),
    );
  }
  function reorder(from: number, to: number) {
    if (from === to) return;
    setItems((existing) => {
      const copy = [...existing];
      const [item] = copy.splice(from, 1);
      if (!item) return existing;
      copy.splice(to, 0, item);
      return copy;
    });
    setSelected((currentIndex) =>
      currentIndex === from
        ? to
        : currentIndex > from && currentIndex <= to
          ? currentIndex - 1
          : currentIndex < from && currentIndex >= to
            ? currentIndex + 1
            : currentIndex,
    );
  }
  async function publish() {
    setBusy(true);
    setMessage(null);
    try {
      const files = await Promise.all(items.map(renderImage));
      const post = await postsApi.create(token, {
        mediaType: "IMAGE",
        images: files.map((file) => ({ mimeType: file.type, size: file.size })),
        caption: caption || undefined,
        visibility: publicPost ? "PUBLIC" : "PRIVATE",
        likesVisible,
      });
      await Promise.all(
        post.uploads.map(async (upload) =>
          uploadToStorage(
            upload.uploadUrl,
            files[upload.position],
            upload.uploadHeaders,
          ),
        ),
      );
      await postsApi.complete(token, post.postId);
      await onPublished();
      onClose();
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof Error ? caught.message : "Unable to publish",
      });
    } finally {
      setBusy(false);
    }
  }
  const next = () => {
    if (!items.length)
      return setMessage({ tone: "error", text: "Choose at least one image." });
    setMessage(null);
    setStep((value) => Math.min(2, value + 1));
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onClose();
      }}
    >
      <section
        className={`flex max-h-[calc(100vh-1.5rem)] ${panelWidth} flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#15151a] shadow-2xl transition-[max-width] duration-300`}
      >
        <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 px-4 py-2.5">
          <div>
            {step > 0 && (
              <button
                disabled={busy}
                onClick={() => setStep((value) => value - 1)}
                className="text-sm text-zinc-400 hover:text-white disabled:opacity-30"
              >
                Back
              </button>
            )}
          </div>
          <h2 className="text-sm font-semibold text-white">
            {!items.length
              ? "Choose photos"
              : ["Adjust", "Filters", "Final details"][step]}
          </h2>
          <div className="flex items-center justify-end gap-2">
            {items.length && step < 2 ? (
              <button
                disabled={busy}
                onClick={next}
                className="rounded-lg bg-[#ff9675] px-3 py-1.5 text-xs font-bold text-[#271718] disabled:opacity-40"
              >
                Next
              </button>
            ) : items.length && step === 2 ? (
              <button
                disabled={busy || !items.length}
                onClick={() => void publish()}
                className="flex items-center gap-1.5 rounded-lg bg-[#ff9675] px-3 py-1.5 text-xs font-bold text-[#271718] disabled:opacity-40"
              >
                {busy && <Spinner />}
                {busy ? "Publishing…" : "Share"}
              </button>
            ) : null}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden p-5">
          {!items.length && (
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/15 bg-black/10 p-8 text-center"
            >
              <label className="cursor-pointer">
                <span className="text-5xl text-[#ff9675]">＋</span>
                <p className="mt-3 font-medium text-white">
                  Drag photos here, or choose from your device
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Up to 10 images · 10 MB each
                </p>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                  }}
                />
              </label>
            </div>
          )}
          {items.length > 0 && step === 0 && (
            <div className="grid min-h-0 place-items-center">
              <div
                onPointerDown={startDrag}
                onPointerMove={drag}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                onWheel={zoom}
                className="relative grid h-[70vh] min-h-0 w-full place-items-center overflow-hidden rounded-2xl bg-black touch-none select-none"
              >
                <div
                  className="relative max-w-full overflow-hidden bg-black transition-[width] duration-200"
                  style={{
                    aspectRatio: String(current?.edit.frameRatio ?? 1),
                    width: `min(100%, max(50%, calc(70vh * ${current?.edit.frameRatio ?? 1})))`,
                  }}
                >
                  {current && (
                    <img
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        setItems((existing) =>
                          existing.map((item, index) =>
                            index === selected
                              ? { ...item, width: image.naturalWidth, height: image.naturalHeight }
                              : item,
                          ),
                        );
                      }}
                      src={current.url}
                      alt=""
                      className={`absolute inset-0 h-full w-full max-w-none object-cover transition-transform ${isDragging ? "duration-0" : "duration-500 ease-out"}`}
                      style={previewStyle}
                    />
                  )}
                  {isDragging && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3"
                    >
                      {Array.from({ length: 9 }, (_, index) => (
                        <span
                          key={index}
                          className={`border-white/45 ${index % 3 !== 2 ? "border-r" : ""} ${index < 6 ? "border-b" : ""}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 z-20">
                  <div className="pointer-events-auto absolute bottom-3 right-3 flex items-center justify-end">
                    <div
                      onPointerDown={(event) => event.stopPropagation()}
                      className={`flex items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-black/75 p-1 shadow-lg backdrop-blur transition-all duration-200 ${frameMenuOpen ? "max-w-64 opacity-100" : "pointer-events-none max-w-0 border-transparent bg-transparent p-0 opacity-0"}`}
                    >
                      {[...frames].reverse().map(([label, ratio]) => (
                        <button
                          type="button"
                          key={String(label)}
                          aria-label={`Use ${String(label)} frame`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            updateEdit({ frameRatio: Number(ratio), x: 0, y: 0 });
                            setFrameMenuOpen(false);
                          }}
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base transition ${current?.edit.frameRatio === ratio ? "bg-white/25 text-white" : "text-zinc-300 hover:bg-white/10"}`}
                          title={String(label)}
                        >
                          <span className="leading-none">{frameIcons[String(label)]}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      aria-label="Choose frame size"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setFrameMenuOpen((open) => !open);
                      }}
                      className={`grid h-9 w-9 place-items-center rounded-full text-xl text-white transition ${frameMenuOpen ? "bg-black/75" : "bg-transparent hover:bg-black/60"}`}
                    >
                      <span className="leading-none">▣</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="grid min-h-0 place-items-center overflow-hidden rounded-2xl bg-black p-4">
                <div
                  className="relative max-h-full max-w-full overflow-hidden bg-black"
                  style={{
                    aspectRatio: String(current?.edit.frameRatio ?? 1),
                    width: `min(100%, max(50%, calc(50vh * ${current?.edit.frameRatio ?? 1})))`,
                  }}
                >
                  {current && (
                    <img
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      src={current.url}
                      alt=""
                      className="absolute inset-0 h-full w-full max-w-none object-cover"
                      style={previewStyle}
                    />
                  )}
                </div>
              </div>
              <aside className="space-y-4">
                <p className="text-sm font-semibold text-white">
                  Choose a filter
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {filters.map(([name, filter]) => (
                    <button
                      key={name}
                      onClick={() => updateEdit({ filter })}
                      className={`overflow-hidden rounded-xl border text-left ${current?.edit.filter === filter ? "border-[#ff9675]" : "border-white/10"}`}
                    >
                      <img
                        src={current?.url}
                        alt=""
                        className="aspect-square w-full object-cover"
                        style={{ filter }}
                      />
                      <span className="block px-2 py-1.5 text-[10px] text-zinc-300">
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="grid min-h-0 place-items-center overflow-hidden rounded-2xl bg-black p-4">
                <div
                  className="relative max-h-full max-w-full overflow-hidden bg-black"
                  style={{
                    aspectRatio: String(current?.edit.frameRatio ?? 1),
                    width: `min(100%, max(50%, calc(50vh * ${current?.edit.frameRatio ?? 1})))`,
                  }}
                >
                  {current && (
                    <img
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                      src={current.url}
                      alt=""
                      className="absolute inset-0 h-full w-full max-w-none object-cover"
                      style={previewStyle}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-white">
                  Description
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={2200}
                    placeholder="Write a caption…"
                    className="mt-2 min-h-32 w-full resize-none rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#ff9675]/50"
                  />
                </label>
                <label className="flex items-center justify-between border-b border-white/10 py-3 text-sm text-zinc-300">
                  Show like count
                  <input
                    type="checkbox"
                    checked={likesVisible}
                    onChange={(event) => setLikesVisible(event.target.checked)}
                    className="accent-[#ff9675]"
                  />
                </label>
                <label className="flex items-center justify-between py-3 text-sm text-zinc-300">
                  Public post
                  <input
                    type="checkbox"
                    checked={publicPost}
                    onChange={(event) => setPublicPost(event.target.checked)}
                    className="accent-[#ff9675]"
                  />
                </label>
              </div>
            </div>
          )}
          {items.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {items.map((item, index) => (
                <div
                  key={item.url}
                  draggable={step === 0}
                  onDragStart={() => {
                    reorderIndex.current = index;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (reorderIndex.current !== null)
                      reorder(reorderIndex.current, index);
                    reorderIndex.current = null;
                  }}
                  onDragEnd={() => {
                    reorderIndex.current = null;
                  }}
                  className="group relative h-16 w-16 shrink-0 opacity-50 transition-opacity duration-200 hover:opacity-100"
                >
                  <button
                    onClick={() => setSelected(index)}
                    className="block h-16 w-full overflow-hidden rounded-lg"
                  >
                    <img
                      draggable={false}
                      src={item.url}
                      alt=""
                      className="h-16 w-full object-cover"
                      style={{ filter: item.edit.filter }}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeItem(index);
                    }}
                    className="absolute right-1 top-1 grid h-5 w-5 -translate-y-0.5 place-items-center rounded-full bg-black/75 text-xs leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              {step === 0 && items.length < 10 && (
                <label className="grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-white/15 text-2xl text-zinc-500">
                  +
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      if (event.target.files) addFiles(event.target.files);
                    }}
                  />
                </label>
              )}
            </div>
          )}
          {message && (
            <div className="mt-4">
              <Alert tone={message.tone}>{message.text}</Alert>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
