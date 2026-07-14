import GameDetail from "@/src/components/GameDetail";

type Params = Promise<{ id: string }>;

export default async function JuegoPage({ params }: { params: Params }) {
  const { id } = await params;
  return <GameDetail id={id} />;
}
