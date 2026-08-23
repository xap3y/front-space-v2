"use client";

import {PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {
    FaArrowDown, FaArrowUp, FaCircle, FaCloudArrowUp, FaDownload, FaEraser, FaEye, FaEyeSlash,
    FaArrowPointer, FaImage, FaLayerGroup, FaMinus, FaPaintbrush, FaPlus, FaRotateLeft, FaShapes,
    FaTrashCan, FaUpload
} from "react-icons/fa6";
import {MdCropFree, MdOutlineRectangle, MdTextFields} from "react-icons/md";
import {useUser} from "@/hooks/useUser";
import {getUserImages} from "@/lib/apiGetters";
import {errorToast, okToast, uploadImage} from "@/lib/client";
import {ImageListResponse, UploadedImagePage} from "@/types/image";
import HoverDiv from "@/components/HoverDiv";
import MainStringInput from "@/components/MainStringInput";

type Tool = "select" | "pencil" | "eraser" | "line" | "rect" | "circle" | "text";
type EraserMode = "object" | "brush";
type Point = {x: number; y: number};
type ErasePath = {id: string; points: Point[]; thickness: number};
type CommonLayer = {id: string; name: string; visible: boolean; opacity: number};
type ImageLayer = CommonLayer & {kind: "image"; src: string; x: number; y: number; width: number; height: number};
type StrokeLayer = CommonLayer & {kind: "stroke"; points: Point[]; color: string; thickness: number; erase: boolean; erasures?: ErasePath[]};
type ShapeLayer = CommonLayer & {kind: "shape"; shape: "line" | "rect" | "circle"; x: number; y: number; width: number; height: number; color: string; thickness: number; erasures?: ErasePath[]};
type TextLayer = CommonLayer & {kind: "text"; text: string; x: number; y: number; color: string; size: number; background: string};
type Layer = ImageLayer | StrokeLayer | ShapeLayer | TextLayer;
type DragState = {id: string; mode: "move" | "resize"; start: Point; x: number; y: number; width: number; height: number; points?: Point[]; erasures?: ErasePath[]} | null;

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function shapePoints(layer: ShapeLayer): Point[] {
    if (layer.shape === "line") return Array.from({length: 101}, (_, index) => ({
        x: layer.x + layer.width * index / 100,
        y: layer.y + layer.height * index / 100,
    }));
    if (layer.shape === "rect") {
        const points: Point[] = [];
        const pushEdge = (start: Point, end: Point) => {
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const steps = Math.max(2, Math.ceil(distance / 3));
            for (let index = 0; index < steps; index++) points.push({
                x: start.x + (end.x - start.x) * index / steps,
                y: start.y + (end.y - start.y) * index / steps,
            });
        };
        const x2 = layer.x + layer.width, y2 = layer.y + layer.height;
        pushEdge({x: layer.x, y: layer.y}, {x: x2, y: layer.y});
        pushEdge({x: x2, y: layer.y}, {x: x2, y: y2});
        pushEdge({x: x2, y: y2}, {x: layer.x, y: y2});
        pushEdge({x: layer.x, y: y2}, {x: layer.x, y: layer.y});
        points.push({x: layer.x, y: layer.y});
        return points;
    }
    const circumference = Math.PI * (Math.abs(layer.width) + Math.abs(layer.height));
    const steps = Math.max(64, Math.ceil(circumference / 3));
    return Array.from({length: steps + 1}, (_, index) => {
        const angle = Math.PI * 2 * index / steps;
        return {
            x: layer.x + layer.width / 2 + Math.cos(angle) * layer.width / 2,
            y: layer.y + layer.height / 2 + Math.sin(angle) * layer.height / 2,
        };
    });
}

function densifyPoints(points: Point[], spacing = 3): Point[] {
    if (points.length < 2) return points;
    const dense: Point[] = [points[0]];
    for (let index = 1; index < points.length; index++) {
        const start = points[index - 1], end = points[index];
        if (!Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(end.x) || !Number.isFinite(end.y)) {
            if (Number.isFinite(end.x) && Number.isFinite(end.y)) dense.push({x: Number.NaN, y: Number.NaN}, end);
            continue;
        }
        const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / spacing));
        for (let step = 1; step <= steps; step++) dense.push({
            x: start.x + (end.x - start.x) * step / steps,
            y: start.y + (end.y - start.y) * step / steps,
        });
    }
    return dense;
}

function EditorButton({children, active, type = "INFO", ...props}: React.ComponentProps<typeof HoverDiv> & {active?: boolean}) {
    return <HoverDiv type={type} {...props} className={`${props.className ?? ""} ${active ? "ring-2 ring-emerald-400/40" : ""}`}>{children}</HoverDiv>;
}

export default function ImageEditorClient() {
    const {user, loadingUser} = useUser();
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const layerFileRef = useRef<HTMLInputElement>(null);
    const imageCache = useRef(new Map<string, HTMLImageElement>());
    const dragRef = useRef<DragState>(null);
    const drawingRef = useRef<string | null>(null);
    const erasingRef = useRef(false);
    const eraseGestureRef = useRef<string | null>(null);
    const historyRef = useRef<Layer[][]>([]);

    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tool, setTool] = useState<Tool>("select");
    const [canvasSize, setCanvasSize] = useState({width: 1200, height: 800});
    const [zoom, setZoom] = useState(0.75);
    const [color, setColor] = useState("#34D399");
    const [thickness, setThickness] = useState(8);
    const [opacity, setOpacity] = useState(1);
    const [textValue, setTextValue] = useState("Space");
    const [textSize, setTextSize] = useState(48);
    const [textBackground, setTextBackground] = useState("#00000000");
    const [sourceOpen, setSourceOpen] = useState(true);
    const [uploadsOpen, setUploadsOpen] = useState(false);
    const [uploads, setUploads] = useState<UploadedImagePage[]>([]);
    const [uploadsLoading, setUploadsLoading] = useState(false);
    const [draggingFile, setDraggingFile] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState("");
    const [undoCount, setUndoCount] = useState(0);
    const [eraserMode, setEraserMode] = useState<EraserMode>("brush");
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
    const [brushCursor, setBrushCursor] = useState<Point | null>(null);

    const selected = useMemo(() => layers.find(layer => layer.id === selectedId) ?? null, [layers, selectedId]);

    const checkpoint = useCallback(() => {
        historyRef.current.push(structuredClone(layers));
        if (historyRef.current.length > 50) historyRef.current.shift();
        setUndoCount(historyRef.current.length);
    }, [layers]);

    const undo = useCallback(() => {
        const previous = historyRef.current.pop();
        if (!previous) return;
        setLayers(previous);
        setSelectedId(null);
        setTool("select");
        setUndoCount(historyRef.current.length);
    }, []);

    useEffect(() => {
        if (!loadingUser && !user) router.replace("/login?next=/home/editor");
    }, [loadingUser, router, user]);

    const getImage = useCallback((src: string) => {
        let image = imageCache.current.get(src);
        if (!image) {
            image = new Image();
            image.decoding = "async";
            image.crossOrigin = "anonymous";
            image.src = src;
            imageCache.current.set(src, image);
        }
        return image;
    }, []);

    const bounds = useCallback((layer: Layer, ctx?: CanvasRenderingContext2D) => {
        if (layer.kind === "image" || layer.kind === "shape") return {x: layer.x, y: layer.y, width: layer.width, height: layer.height};
        if (layer.kind === "text") {
            const width = ctx ? (ctx.measureText(layer.text).width + 18) : layer.text.length * layer.size * .62;
            return {x: layer.x, y: layer.y - layer.size, width, height: layer.size * 1.25};
        }
        const finitePoints = layer.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
        if (!finitePoints.length) return {x: 0, y: 0, width: 1, height: 1};
        const xs = finitePoints.map(point => point.x), ys = finitePoints.map(point => point.y);
        return {x: Math.min(...xs), y: Math.min(...ys), width: Math.max(1, Math.max(...xs) - Math.min(...xs)), height: Math.max(1, Math.max(...ys) - Math.min(...ys))};
    }, []);

    const render = useCallback((includeSelection = true) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const layer of layers) {
            if (!layer.visible) continue;
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            if (layer.kind === "image") {
                const image = getImage(layer.src);
                if (image.complete && image.naturalWidth) ctx.drawImage(image, layer.x, layer.y, layer.width, layer.height);
                else image.onload = () => requestAnimationFrame(() => render());
            } else if (layer.kind === "stroke" || layer.kind === "shape") {
                const vectorCanvas = document.createElement("canvas");
                vectorCanvas.width = canvas.width;
                vectorCanvas.height = canvas.height;
                const vectorCtx = vectorCanvas.getContext("2d");
                if (vectorCtx) {
                    vectorCtx.lineCap = "round";
                    vectorCtx.lineJoin = "round";
                    vectorCtx.strokeStyle = layer.color;
                    vectorCtx.lineWidth = layer.thickness;
                    vectorCtx.beginPath();
                    if (layer.kind === "stroke") {
                    let drawing = false;
                    layer.points.forEach(point => {
                        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {drawing = false; return;}
                        if (!drawing) {vectorCtx.moveTo(point.x, point.y); drawing = true;}
                        else vectorCtx.lineTo(point.x, point.y);
                    });
                        if (layer.points.length === 1) vectorCtx.lineTo(layer.points[0].x + .1, layer.points[0].y + .1);
                    } else {
                        if (layer.shape === "line") {vectorCtx.moveTo(layer.x, layer.y); vectorCtx.lineTo(layer.x + layer.width, layer.y + layer.height);}
                        if (layer.shape === "rect") vectorCtx.rect(layer.x, layer.y, layer.width, layer.height);
                        if (layer.shape === "circle") vectorCtx.ellipse(layer.x + layer.width / 2, layer.y + layer.height / 2, Math.abs(layer.width / 2), Math.abs(layer.height / 2), 0, 0, Math.PI * 2);
                    }
                    vectorCtx.stroke();
                    vectorCtx.globalCompositeOperation = "destination-out";
                    for (const erasure of layer.erasures ?? []) {
                        if (!erasure.points.length) continue;
                        vectorCtx.lineWidth = erasure.thickness;
                        vectorCtx.beginPath();
                        vectorCtx.moveTo(erasure.points[0].x, erasure.points[0].y);
                        erasure.points.slice(1).forEach(point => vectorCtx.lineTo(point.x, point.y));
                        if (erasure.points.length === 1) vectorCtx.lineTo(erasure.points[0].x + .1, erasure.points[0].y + .1);
                        vectorCtx.stroke();
                    }
                    ctx.drawImage(vectorCanvas, 0, 0);
                }
            } else {
                ctx.font = `600 ${layer.size}px Inter, system-ui, sans-serif`;
                ctx.textBaseline = "alphabetic";
                const metrics = ctx.measureText(layer.text);
                if (layer.background !== "#00000000" && layer.background !== "transparent") {
                    ctx.fillStyle = layer.background;
                    ctx.fillRect(layer.x - 8, layer.y - layer.size, metrics.width + 16, layer.size * 1.25);
                }
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y);
            }
            ctx.restore();
        }

        if (includeSelection && selectedId && tool === "select") {
            const layer = layers.find(item => item.id === selectedId);
            if (layer && layer.visible) {
                ctx.save();
                if (layer.kind === "text") ctx.font = `600 ${layer.size}px Inter, system-ui, sans-serif`;
                const box = bounds(layer, ctx);
                ctx.strokeStyle = "#34d399";
                ctx.lineWidth = 2 / zoom;
                ctx.setLineDash([8 / zoom, 5 / zoom]);
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.setLineDash([]);
                if (layer.kind !== "stroke") {
                    ctx.fillStyle = "#34d399";
                    ctx.fillRect(box.x + box.width - 9 / zoom, box.y + box.height - 9 / zoom, 18 / zoom, 18 / zoom);
                }
                ctx.restore();
            }
        }
    }, [bounds, getImage, layers, selectedId, tool, zoom]);

    useEffect(() => {render();}, [render]);

    const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {x: (event.clientX - rect.left) * canvasSize.width / rect.width, y: (event.clientY - rect.top) * canvasSize.height / rect.height};
    };

    const addImageSource = async (src: string, name: string, closeSource = false) => {
        try {
            const image = getImage(src);
            await image.decode().catch(() => new Promise<void>((resolve, reject) => {image.onload = () => resolve(); image.onerror = () => reject(new Error("Image could not be loaded"));}));
            const isFirst = layers.length === 0;
            const scale = Math.min(1, 1400 / image.naturalWidth, 1000 / image.naturalHeight);
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            checkpoint();
            if (isFirst) setCanvasSize({width, height});
            const layer: ImageLayer = {id: makeId(), kind: "image", name, visible: true, opacity: 1, src, x: isFirst ? 0 : 50, y: isFirst ? 0 : 50, width: isFirst ? width : Math.min(width, canvasSize.width * .55), height: isFirst ? height : height * Math.min(1, canvasSize.width * .55 / width)};
            setLayers(current => [...current, layer]);
            setSelectedId(layer.id);
            setTool("select");
            if (closeSource) setSourceOpen(false);
            setUploadsOpen(false);
        } catch (error) {errorToast(error instanceof Error ? error.message : "Could not load image");}
    };

    const addFile = (file?: File, asLayer = false) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return errorToast("Choose an image file");
        if (file.size > 30 * 1024 * 1024) return errorToast("Image must be smaller than 30 MB");
        const src = URL.createObjectURL(file);
        void addImageSource(src, file.name, !asLayer);
    };

    const openUploads = async () => {
        if (!user?.uid) return;
        setUploadsOpen(true);
        if (uploads.length) return;
        setUploadsLoading(true);
        try {
            const response = await getUserImages(String(user.uid), 0, 36);
            const data = response?.data as ImageListResponse | undefined;
            setUploads(data?.images ?? []);
        } catch {errorToast("Could not load your uploads");}
        finally {setUploadsLoading(false);}
    };

    const updateLayer = (id: string, changes: Partial<Layer>) => {
        checkpoint();
        setLayers(current => current.map(layer => layer.id === id ? {...layer, ...changes} as Layer : layer));
    };

    const distanceToSegment = (point: Point, start: Point, end: Point) => {
        const dx = end.x - start.x, dy = end.y - start.y;
        if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
        const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
        return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
    };

    const vectorTouchesEraser = (layer: StrokeLayer | ShapeLayer | TextLayer, point: Point, radius: number) => {
        if (layer.kind === "text") {
            const box = bounds(layer);
            return point.x >= box.x - radius && point.x <= box.x + box.width + radius && point.y >= box.y - radius && point.y <= box.y + box.height + radius;
        }
        if (layer.kind === "stroke") {
            return layer.points.some((current, index) => {
                const previous = layer.points[index - 1];
                return index > 0 && previous && Number.isFinite(previous.x) && Number.isFinite(previous.y) && Number.isFinite(current.x) && Number.isFinite(current.y) && distanceToSegment(point, previous, current) <= radius + layer.thickness / 2;
            });
        }
        const x1 = layer.x, y1 = layer.y, x2 = layer.x + layer.width, y2 = layer.y + layer.height;
        if (layer.shape === "line") return distanceToSegment(point, {x: x1, y: y1}, {x: x2, y: y2}) <= radius + layer.thickness / 2;
        if (layer.shape === "rect") return [
            [{x: x1, y: y1}, {x: x2, y: y1}], [{x: x2, y: y1}, {x: x2, y: y2}],
            [{x: x2, y: y2}, {x: x1, y: y2}], [{x: x1, y: y2}, {x: x1, y: y1}],
        ].some(([start, end]) => distanceToSegment(point, start, end) <= radius + layer.thickness / 2);
        const rx = Math.max(1, Math.abs(layer.width) / 2), ry = Math.max(1, Math.abs(layer.height) / 2);
        const cx = layer.x + layer.width / 2, cy = layer.y + layer.height / 2;
        const normalized = Math.hypot((point.x - cx) / rx, (point.y - cy) / ry);
        return Math.abs(normalized - 1) <= (radius + layer.thickness / 2) / Math.min(rx, ry);
    };

    const eraseVectorsAt = (point: Point) => {
        const radius = thickness / 2;
        if (eraserMode === "object") {
            setLayers(current => current.filter(layer => layer.kind === "image" || !vectorTouchesEraser(layer, point, radius)));
            setSelectedId(current => current && layers.some(layer => layer.id === current && (layer.kind === "image" || !vectorTouchesEraser(layer, point, radius))) ? current : null);
            return;
        }
        const gestureId = eraseGestureRef.current;
        if (!gestureId) return;
        setLayers(current => current.map(layer => {
            if ((layer.kind !== "stroke" && layer.kind !== "shape") || !vectorTouchesEraser(layer, point, radius)) return layer;
            const erasures = [...(layer.erasures ?? [])];
            const existing = erasures.findIndex(erasure => erasure.id === gestureId);
            if (existing >= 0) erasures[existing] = {...erasures[existing], points: [...erasures[existing].points, point]};
            else erasures.push({id: gestureId, points: [point], thickness});
            return {...layer, erasures};
        }));
    };

    const reorderLayer = (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        setLayers(current => {
            const from = current.findIndex(layer => layer.id === draggedId);
            const to = current.findIndex(layer => layer.id === targetId);
            if (from < 0 || to < 0) return current;
            const next = [...current];
            const [dragged] = next.splice(from, 1);
            next.splice(to, 0, dragged);
            return next;
        });
    };

    const hitLayer = (point: Point) => {
        const ctx = canvasRef.current?.getContext("2d") ?? undefined;
        return [...layers].reverse().find(layer => {
            if (!layer.visible) return false;
            if (layer.kind === "stroke") return vectorTouchesEraser(layer, point, Math.max(8 / zoom, layer.thickness / 2));
            if (layer.kind === "text" && ctx) ctx.font = `600 ${layer.size}px Inter, system-ui, sans-serif`;
            const box = bounds(layer, ctx);
            return point.x >= Math.min(box.x, box.x + box.width) && point.x <= Math.max(box.x, box.x + box.width) && point.y >= Math.min(box.y, box.y + box.height) && point.y <= Math.max(box.y, box.y + box.height);
        });
    };

    const pointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = pointFromEvent(event);
        if (tool === "select") {
            const currentSelection = layers.find(layer => layer.id === selectedId);
            if (currentSelection && (currentSelection.kind === "image" || currentSelection.kind === "shape" || currentSelection.kind === "text")) {
                const ctx = canvasRef.current?.getContext("2d") ?? undefined;
                if (currentSelection.kind === "text" && ctx) ctx.font = `600 ${currentSelection.size}px Inter, system-ui, sans-serif`;
                const box = bounds(currentSelection, ctx);
                if (Math.hypot(point.x - (box.x + box.width), point.y - (box.y + box.height)) < 34 / zoom) {
                    checkpoint();
                    dragRef.current = {id: currentSelection.id, mode: "resize", start: point, x: "x" in currentSelection ? currentSelection.x : 0, y: "y" in currentSelection ? currentSelection.y : 0, width: "width" in currentSelection ? currentSelection.width : box.width, height: "height" in currentSelection ? currentSelection.height : box.height};
                    return;
                }
            }
            const layer = hitLayer(point);
            setSelectedId(layer?.id ?? null);
            if (layer) {
                checkpoint();
                const ctx = canvasRef.current?.getContext("2d") ?? undefined;
                if (layer.kind === "text" && ctx) ctx.font = `600 ${layer.size}px Inter, system-ui, sans-serif`;
                const box = bounds(layer, ctx);
                dragRef.current = {id: layer.id, mode: "move", start: point, x: "x" in layer ? layer.x : box.x, y: "y" in layer ? layer.y : box.y, width: "width" in layer ? layer.width : box.width, height: "height" in layer ? layer.height : box.height, points: layer.kind === "stroke" ? structuredClone(layer.points) : undefined, erasures: "erasures" in layer ? structuredClone(layer.erasures) : undefined};
            }
            return;
        }
        if (tool === "text") {
            checkpoint();
            const layer: TextLayer = {id: makeId(), kind: "text", name: textValue || "Text", visible: true, opacity, text: textValue || "Text", x: point.x, y: point.y, color, size: textSize, background: textBackground};
            setLayers(current => [...current, layer]); setSelectedId(layer.id); setTool("select"); return;
        }
        if (tool === "eraser") {
            checkpoint();
            erasingRef.current = true;
            eraseGestureRef.current = makeId();
            eraseVectorsAt(point);
            return;
        }
        if (tool === "pencil") {
            checkpoint();
            const layer: StrokeLayer = {id: makeId(), kind: "stroke", name: "Drawing", visible: true, opacity, points: [point], color, thickness, erase: false};
            drawingRef.current = layer.id; setLayers(current => [...current, layer]); setSelectedId(layer.id); return;
        }
        checkpoint();
        const layer: ShapeLayer = {id: makeId(), kind: "shape", name: tool[0].toUpperCase() + tool.slice(1), visible: true, opacity, shape: tool, x: point.x, y: point.y, width: 0, height: 0, color, thickness};
        drawingRef.current = layer.id; setLayers(current => [...current, layer]); setSelectedId(layer.id);
    };

    const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const point = pointFromEvent(event);
        if (tool === "pencil" || tool === "eraser") setBrushCursor(point);
        if (erasingRef.current) {
            eraseVectorsAt(point);
        } else if (dragRef.current) {
            const drag = dragRef.current, dx = point.x - drag.start.x, dy = point.y - drag.start.y;
            setLayers(current => current.map(layer => {
                if (layer.id !== drag.id) return layer;
                const movedErasures = drag.erasures?.map(erasure => ({...erasure, points: erasure.points.map(original => ({x: original.x + dx, y: original.y + dy}))}));
                if (layer.kind === "stroke" && drag.points) return {...layer, points: drag.points.map(original => Number.isFinite(original.x) && Number.isFinite(original.y) ? {x: original.x + dx, y: original.y + dy} : original), erasures: movedErasures};
                if (!("x" in layer)) return layer;
                if (drag.mode === "move") return layer.kind === "shape" ? {...layer, x: drag.x + dx, y: drag.y + dy, erasures: movedErasures} : {...layer, x: drag.x + dx, y: drag.y + dy};
                if (layer.kind === "text") return {...layer, size: clamp(Math.round((drag.height + dy) / 1.25), 8, 400)};
                return {...layer, width: Math.max(8, drag.width + dx), height: Math.max(8, drag.height + dy)};
            }));
        } else if (drawingRef.current) {
            setLayers(current => current.map(layer => {
                if (layer.id !== drawingRef.current) return layer;
                if (layer.kind === "stroke") return {...layer, points: [...layer.points, point]};
                if (layer.kind === "shape") {
                    let width = point.x - layer.x, height = point.y - layer.y;
                    if (event.shiftKey && (layer.shape === "circle" || layer.shape === "rect")) {
                        const size = Math.max(Math.abs(width), Math.abs(height));
                        width = Math.sign(width || 1) * size;
                        height = Math.sign(height || 1) * size;
                    }
                    return {...layer, width, height};
                }
                return layer;
            }));
        }
    };

    const pointerUp = () => {
        if (drawingRef.current) {
            const id = drawingRef.current;
            setLayers(current => current.map(layer => {
                if (layer.id !== id || layer.kind !== "shape") return layer;
                const x = layer.width < 0 ? layer.x + layer.width : layer.x;
                const y = layer.height < 0 ? layer.y + layer.height : layer.y;
                return {...layer, x, y, width: Math.abs(layer.width), height: Math.abs(layer.height)};
            }));
        }
        dragRef.current = null;
        drawingRef.current = null;
        erasingRef.current = false;
        eraseGestureRef.current = null;
    };

    const removeSelected = () => {
        if (!selectedId) return;
        checkpoint();
        setLayers(current => current.filter(layer => layer.id !== selectedId));
        setSelectedId(null);
    };

    const moveLayer = (direction: -1 | 1) => {
        if (!selectedId) return;
        checkpoint();
        setLayers(current => {
            const index = current.findIndex(layer => layer.id === selectedId), target = clamp(index + direction, 0, current.length - 1);
            if (index < 0 || index === target) return current;
            const next = [...current], [item] = next.splice(index, 1); next.splice(target, 0, item); return next;
        });
    };

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.matches("input, textarea, [contenteditable='true']")) return;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {event.preventDefault(); undo(); return;}
            if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {event.preventDefault(); removeSelected();}
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selectedId, undo]);

    const exportBlob = async () => {
        setSelectedId(null);
        await new Promise(resolve => requestAnimationFrame(resolve));
        render(false);
        const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, "image/png", 1));
        render(true);
        if (!blob) throw new Error("Could not export the canvas");
        return blob;
    };

    const download = async () => {
        try {const blob = await exportBlob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `space-edit-${Date.now()}.png`; anchor.click(); URL.revokeObjectURL(url);}
        catch (error) {errorToast(error instanceof Error ? error.message : "Export failed");}
    };

    const upload = async () => {
        if (!user?.apiKey) return errorToast("You must be logged in");
        setUploading(true); setUploadedUrl("");
        try {
            const blob = await exportBlob();
            const form = new FormData();
            form.append("file", new File([blob], `space-edit-${Date.now()}.png`, {type: "image/png"}));
            form.append("apiKey", user.apiKey); form.append("source", "PORTAL"); form.append("desc", "Created with Space Image Editor");
            const result = await uploadImage(form, user.apiKey, null);
            setUploadedUrl(result.urlSet.portalUrl); okToast("Edited image uploaded to your account");
        } catch (error) {errorToast(error instanceof Error ? error.message : "Upload failed");}
        finally {setUploading(false);}
    };

    const selectedOpacity = selected?.opacity ?? opacity;

    if (loadingUser || !user) return <div className="grid min-h-[70vh] place-items-center text-sm text-zinc-500">Loading editor…</div>;

    return <div className="flex min-h-[calc(100vh-1.5rem)] flex-col p-3 text-zinc-100 md:p-5">
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="flex items-center gap-2"><span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Beta</span><h1 className="text-xl font-semibold md:text-2xl">Image editor</h1></div><p className="mt-1 text-xs text-zinc-500">Compose, draw and export without leaving Space.</p></div>
            <div className="flex flex-wrap gap-2">
                <EditorButton icon={<FaArrowDown className="rotate-90"/>} onClick={() => router.push("/home/dashboard")} className="px-3 py-2 text-xs">Back home</EditorButton>
                <EditorButton icon={<FaRotateLeft/>} onClick={undo} disabled={undoCount === 0} className="px-3 py-2 text-xs">Undo</EditorButton>
                <EditorButton icon={<FaImage/>} onClick={() => setSourceOpen(true)} className="px-3 py-2 text-xs">Open image</EditorButton>
                <EditorButton icon={<FaPlus/>} onClick={() => layerFileRef.current?.click()} className="px-3 py-2 text-xs">Add layer</EditorButton>
                <EditorButton icon={<FaDownload/>} onClick={download} disabled={!layers.length} className="px-3 py-2 text-xs">Download</EditorButton>
                <EditorButton type="SAVE" icon={<FaCloudArrowUp/>} onClick={upload} disabled={!layers.length || uploading} className="px-3 py-2 text-xs font-semibold">{uploading ? "Uploading…" : "Upload to Space"}</EditorButton>
            </div>
        </header>

        {uploadedUrl && <a href={uploadedUrl} target="_blank" className="mb-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] px-4 py-3 text-xs text-emerald-300"><span>Upload complete — open the image</span><FaImage/></a>}

        <div className="grid flex-1 items-stretch gap-3 xl:min-h-0 xl:grid-cols-[210px_minmax(0,1fr)_260px]">
            <aside className="box-primary h-full space-y-4 p-3">
                <PanelTitle icon={<FaPaintbrush/>}>Tools</PanelTitle>
                <div className="grid grid-cols-2 gap-2">
                    <ToolButton tool="select" current={tool} set={setTool} icon={<FaArrowPointer/>} label="Select"/>
                    <ToolButton tool="pencil" current={tool} set={setTool} icon={<FaPaintbrush/>} label="Draw"/>
                    <ToolButton tool="eraser" current={tool} set={setTool} icon={<FaEraser/>} label="Eraser"/>
                    <ToolButton tool="line" current={tool} set={setTool} icon={<FaMinus/>} label="Line"/>
                    <ToolButton tool="rect" current={tool} set={setTool} icon={<MdOutlineRectangle/>} label="Rectangle"/>
                    <ToolButton tool="circle" current={tool} set={setTool} icon={<FaCircle/>} label="Circle"/>
                    <ToolButton tool="text" current={tool} set={setTool} icon={<MdTextFields/>} label="Text"/>
                </div>
                {tool === "eraser" && <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/15 p-2"><EditorButton active={eraserMode === "brush"} onClick={() => setEraserMode("brush")} className="px-2 py-2 text-[10px]">Brush erase</EditorButton><EditorButton active={eraserMode === "object"} onClick={() => setEraserMode("object")} className="px-2 py-2 text-[10px]">Whole object</EditorButton></div>}
                <Control label="Color"><input type="color" value={color} onChange={event => setColor(event.target.value)} className="h-9 w-full cursor-pointer rounded-lg bg-transparent"/></Control>
                <Control label={`Thickness · ${thickness}px`}><input type="range" min="1" max="80" value={thickness} onChange={event => setThickness(Number(event.target.value))} className="w-full accent-emerald-400"/></Control>
                <Control label={`Opacity · ${Math.round(selectedOpacity * 100)}%`}><input type="range" min="5" max="100" value={Math.round(selectedOpacity * 100)} onChange={event => {const value = Number(event.target.value) / 100; selected ? updateLayer(selected.id, {opacity: value}) : setOpacity(value);}} className="w-full accent-emerald-400"/></Control>
                {tool === "text" && <div className="space-y-2 rounded-xl border border-white/10 bg-black/15 p-2.5"><MainStringInput value={textValue} onChange={setTextValue} placeholder="Text" className="rounded-lg border-white/10" inputClassName="px-2.5 py-2 text-xs"/><Control label={`Size · ${textSize}px`}><input type="range" min="10" max="180" value={textSize} onChange={event => setTextSize(Number(event.target.value))} className="w-full accent-emerald-400"/></Control><Control label="Background"><div className="flex gap-2"><input type="color" value={textBackground === "#00000000" ? "#000000" : textBackground} onChange={event => setTextBackground(event.target.value)} className="h-8 flex-1"/><EditorButton onClick={() => setTextBackground("#00000000")} className="px-2 py-1 text-[10px]">None</EditorButton></div></Control></div>}
            </aside>

            <main className="box-primary flex min-h-[560px] min-w-0 flex-col overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-500"><MdCropFree/><span>{canvasSize.width} × {canvasSize.height}px</span></div>
                    <div className="flex items-center gap-1"><EditorButton onClick={() => setZoom(value => clamp(value - .1, .1, 3))} icon={<FaMinus/>} className="h-8 w-8 p-0" aria-label="Zoom out"/><span className="w-14 text-center text-xs text-zinc-400">{Math.round(zoom * 100)}%</span><EditorButton onClick={() => setZoom(value => clamp(value + .1, .1, 3))} icon={<FaPlus/>} className="h-8 w-8 p-0" aria-label="Zoom in"/><EditorButton onClick={() => setZoom(.75)} icon={<FaRotateLeft/>} className="ml-1 h-8 w-8 p-0" aria-label="Reset zoom"/></div>
                </div>
                <div className="editor-checkerboard min-h-0 flex-1 overflow-auto p-8">
                    <div className="relative mx-auto" style={{width: canvasSize.width * zoom, height: canvasSize.height * zoom}}>
                        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerEnter={event => {if (tool === "pencil" || tool === "eraser") setBrushCursor(pointFromEvent(event));}} onPointerLeave={() => {if (!drawingRef.current && !erasingRef.current) setBrushCursor(null);}} onPointerUp={pointerUp} onPointerCancel={pointerUp} className={`block touch-none bg-transparent shadow-2xl ${tool === "pencil" || tool === "eraser" ? "cursor-none" : tool === "select" ? "cursor-default" : "cursor-crosshair"}`} style={{width: canvasSize.width * zoom, height: canvasSize.height * zoom}}/>
                        {brushCursor && (tool === "pencil" || tool === "eraser") && <span className="pointer-events-none absolute z-10 rounded-full" style={{left: brushCursor.x * zoom, top: brushCursor.y * zoom, width: Math.max(2, thickness * zoom), height: Math.max(2, thickness * zoom), transform: "translate(-50%, -50%)", background: tool === "pencil" ? color : "rgba(255,255,255,.08)", opacity: tool === "pencil" ? opacity : 1, border: tool === "eraser" ? "1px solid rgba(255,255,255,.9)" : "1px solid rgba(0,0,0,.45)", boxShadow: "0 0 0 1px rgba(0,0,0,.45)"}}/>}
                    </div>
                </div>
            </main>

            <aside className="box-primary h-full space-y-4 p-3">
                <PanelTitle icon={<FaLayerGroup/>}>Layers</PanelTitle>
                <div className="flex gap-2"><EditorButton icon={<FaArrowUp/>} onClick={() => moveLayer(1)} disabled={!selected} className="h-8 flex-1 px-2 text-xs">Up</EditorButton><EditorButton icon={<FaArrowDown/>} onClick={() => moveLayer(-1)} disabled={!selected} className="h-8 flex-1 px-2 text-xs">Down</EditorButton><EditorButton type="DELETE" icon={<FaTrashCan/>} onClick={removeSelected} disabled={!selected} className="h-8 w-9 p-0" aria-label="Delete layer"/></div>
                <div className="space-y-1.5">{[...layers].reverse().map(layer => <div key={layer.id} draggable onDragStart={() => {checkpoint(); setDraggedLayerId(layer.id);}} onDragEnd={() => setDraggedLayerId(null)} onDragOver={event => event.preventDefault()} onDrop={event => {event.preventDefault(); if (draggedLayerId) reorderLayer(draggedLayerId, layer.id); setDraggedLayerId(null);}} onClick={() => {setSelectedId(layer.id); setTool("select");}} className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 transition active:cursor-grabbing ${draggedLayerId === layer.id ? "opacity-40" : ""} ${selectedId === layer.id ? "border-emerald-400/30 bg-emerald-400/[.07]" : "border-white/[.07] bg-black/10 hover:border-white/15"}`}><EditorButton type="INFO" icon={layer.visible ? <FaEye/> : <FaEyeSlash/>} onClick={event => {event.stopPropagation(); updateLayer(layer.id, {visible: !layer.visible});}} className="h-7 w-7 shrink-0 p-0" aria-label={layer.visible ? "Hide layer" : "Show layer"}/><span className="min-w-0 flex-1 truncate text-xs">{layer.name}</span><span className="text-[9px] uppercase text-zinc-600">{layer.kind}</span></div>)}</div>
                {selected && <div className="space-y-3 border-t border-white/10 pt-3"><PanelTitle icon={<FaShapes/>}>Properties</PanelTitle><MainStringInput value={selected.name} onChange={value => updateLayer(selected.id, {name: value})} className="rounded-lg border-white/10" inputClassName="px-2.5 py-2 text-xs"/>{"color" in selected && <Control label="Selected color"><input type="color" value={selected.color} onChange={event => updateLayer(selected.id, {color: event.target.value})} className="h-9 w-full cursor-pointer rounded-lg bg-transparent"/></Control>}{"x" in selected && <div className="grid grid-cols-2 gap-2"><Numeric label="X" value={Math.round(selected.x)} onChange={value => updateLayer(selected.id, {x: value})}/><Numeric label="Y" value={Math.round(selected.y)} onChange={value => updateLayer(selected.id, {y: value})}/>{"width" in selected && <><Numeric label="Width" value={Math.round(selected.width)} onChange={value => updateLayer(selected.id, {width: Math.max(1, value)})}/><Numeric label="Height" value={Math.round(selected.height)} onChange={value => updateLayer(selected.id, {height: Math.max(1, value)})}/></>}</div>}</div>}
                <div className="border-t border-white/10 pt-3"><PanelTitle icon={<MdCropFree/>}>Canvas size</PanelTitle><div className="mt-2 grid grid-cols-2 gap-2"><Numeric label="Width" value={canvasSize.width} onChange={width => setCanvasSize(current => ({...current, width: clamp(width, 64, 5000)}))}/><Numeric label="Height" value={canvasSize.height} onChange={height => setCanvasSize(current => ({...current, height: clamp(height, 64, 5000)}))}/></div></div>
            </aside>
        </div>

        <input ref={fileRef} hidden type="file" accept="image/*" onChange={event => addFile(event.target.files?.[0])}/>
        <input ref={layerFileRef} hidden type="file" accept="image/*" onChange={event => addFile(event.target.files?.[0], true)}/>

        {sourceOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101014] p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Start editing</span><h2 className="mt-1 text-xl font-semibold">Choose an image source</h2><p className="mt-1 text-xs text-zinc-500">Your gallery stays private until you choose to open it.</p></div><EditorButton onClick={() => setSourceOpen(false)} className="px-3 py-2 text-xs">Close</EditorButton></div><div onDragOver={event => {event.preventDefault(); setDraggingFile(true);}} onDragLeave={() => setDraggingFile(false)} onDrop={event => {event.preventDefault(); setDraggingFile(false); addFile(event.dataTransfer.files[0]);}} className={`rounded-xl border-2 border-dashed p-8 text-center transition ${draggingFile ? "border-emerald-400 bg-emerald-400/10" : "border-zinc-700 bg-black/20"}`}><FaUpload className="mx-auto mb-3 text-3xl text-emerald-400"/><p className="text-sm font-semibold">Drop an image here</p><p className="mt-1 text-xs text-zinc-500">PNG, JPEG, WebP, GIF and other browser-supported formats</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><EditorButton type="SAVE" icon={<FaImage/>} onClick={() => fileRef.current?.click()} className="w-full px-4 py-3 text-sm font-semibold">Select from computer</EditorButton><EditorButton icon={<FaLayerGroup/>} onClick={openUploads} className="w-full px-4 py-3 text-sm font-semibold">Select from uploads</EditorButton></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><EditorButton onClick={() => setSourceOpen(false)} className="w-full px-4 py-2 text-xs">Use blank canvas</EditorButton><EditorButton onClick={() => router.push("/home/dashboard")} className="w-full px-4 py-2 text-xs">Exit editor</EditorButton></div></div></div>}

        {uploadsOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"><div className="max-h-[82vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="font-semibold">Your uploads</h2><p className="text-xs text-zinc-500">Choose one image to open in the editor.</p></div><EditorButton onClick={() => setUploadsOpen(false)} className="px-3 py-2 text-xs">Close</EditorButton></div><div className="grid max-h-[68vh] grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">{uploadsLoading ? <p className="col-span-full py-16 text-center text-sm text-zinc-500">Loading uploads…</p> : uploads.length ? uploads.map(image => {const src = image.urls.rawUrl; return <EditorButton type="INFO" key={image.uniqueId} onClick={() => void addImageSource(src, image.description || image.uniqueId, true)} className="group flex-col items-stretch gap-0 overflow-hidden rounded-xl bg-black/20 p-0 text-left"><img src={src} alt={image.description || image.uniqueId} className="aspect-square w-full object-cover transition group-hover:scale-[1.03]"/><span className="truncate p-2 text-[11px] text-zinc-400">{image.description || image.uniqueId}</span></EditorButton>;}) : <p className="col-span-full py-16 text-center text-sm text-zinc-500">No uploaded images found.</p>}</div></div></div>}
    </div>;
}

function PanelTitle({icon, children}: {icon: React.ReactNode; children: React.ReactNode}) {return <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-500">{icon}{children}</div>;}
function Control({label, children}: {label: string; children: React.ReactNode}) {return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</span>{children}</label>;}
function ToolButton({tool, current, set, icon, label}: {tool: Tool; current: Tool; set: (tool: Tool) => void; icon: React.ReactNode; label: string}) {return <EditorButton active={current === tool} icon={icon} onClick={() => set(tool)} className="h-14 flex-col gap-1 rounded-lg p-1 text-[10px] font-semibold">{label}</EditorButton>;}
function Numeric({label, value, onChange}: {label: string; value: number; onChange: (value: number) => void}) {return <label><span className="mb-1 block text-[9px] uppercase tracking-wider text-zinc-600">{label}</span><MainStringInput type="number" numericOnly value={value} onChange={value => onChange(Number(value) || 0)} className="rounded-lg border-white/10" inputClassName="px-2 py-1.5 text-xs"/></label>;}
