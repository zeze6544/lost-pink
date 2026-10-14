import { NextResponse } from "next/server";
import { readLocalImage } from "@/lib/images";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const file = await readLocalImage(id);
  if (!file) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
