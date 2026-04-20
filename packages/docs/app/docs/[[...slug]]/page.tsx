import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  notFound();
}
