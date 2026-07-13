"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { updateAvatarAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";

export function AvatarUpload({
  currentUrl,
  name,
}: {
  currentUrl?: string | null;
  name?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const initial = (name?.trim()[0] ?? "K").toUpperCase();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("avatar", file);
    start(async () => {
      const res = await updateAvatarAction(fd);
      if (res.ok) {
        setPreview(res.url);
        toast.success("Avatar atualizado.");
        router.refresh();
      } else {
        toast.error(res.error);
        setPreview(currentUrl ?? null);
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <Image
          src={preview}
          alt="Sua foto de perfil"
          width={64}
          height={64}
          unoptimized={preview.startsWith("blob:")}
          className="size-16 rounded-full border border-border object-cover"
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-full bg-forest-100 dark:bg-forest-800 text-xl font-semibold text-forest-700 dark:text-forest-200">
          {initial}
        </span>
      )}
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onChange}
          aria-label="Trocar avatar"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {pending ? "Enviando..." : "Trocar avatar"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG ou WEBP, até 2 MB.
        </p>
      </div>
    </div>
  );
}
