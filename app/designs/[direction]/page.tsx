import { notFound } from "next/navigation";
import DesignPreview from "../design-preview";
import { isDirection, directions } from "../directions";
import "../designs.css";

export default async function DirectionPage({ params, searchParams }: {
  params: Promise<{ direction: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { direction } = await params;
  if (!isDirection(direction)) notFound();
  const { view } = await searchParams;
  return <DesignPreview key={direction} direction={direction} initialView={view === "today" ? "today" : "welcome"} />;
}

export async function generateMetadata({ params }: { params: Promise<{ direction: string }> }) {
  const { direction } = await params;
  return { title: isDirection(direction) ? `${directions[direction].name} — Daywell design preview` : "Daywell" };
}
