import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Downscales images to keep demo localStorage small. */
export async function readImages(files: FileList | File[]): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  for (const f of Array.from(files)) {
    if (!TYPES.includes(f.type)) { errors.push(`${f.name}: only JPG, PNG or WEBP allowed`); continue; }
    if (f.size > MAX) { errors.push(`${f.name}: exceeds 5 MB`); continue; }
    const src = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });
    const img = await new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = img.width * scale;
    c.height = img.height * scale;
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    urls.push(c.toDataURL("image/jpeg", 0.7));
  }
  return { urls, errors };
}

export function PhotoInput({ label = "Upload photos", onAdd, size = "sm" }: { label?: string; onAdd: (urls: string[]) => void; size?: "sm" | "default" }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={async (e) => {
        if (!e.target.files?.length) return;
        const { urls, errors } = await readImages(e.target.files);
        errors.forEach((er) => toast.error(er));
        if (urls.length) onAdd(urls);
        e.target.value = "";
      }} />
      <Button type="button" size={size} variant="outline" onClick={() => ref.current?.click()}><Upload className="h-3.5 w-3.5" />{label}</Button>
    </>
  );
}
