import GamePlayer from "@/src/components/GamePlayer";

type Params = Promise<{ id: string }>;

export default async function JugarPage({ params }: { params: Params }) {
  const { id } = await params;
  return <GamePlayer id={id} />;
}
