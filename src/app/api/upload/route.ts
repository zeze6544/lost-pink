import { NextResponse } from "next/server";
import { MAX_IMAGE_BYTES, saveImage, sniffImage } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Each photo must be under 2MB." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniff = sniffImage(buf);
  if (!sniff) {
    return NextResponse.json(
      { error: "jpeg, png, or webp only." },
      { status: 400 },
    );
  }

  try {
    const url = await saveImage(buf, sniff);
    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "could not store photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
