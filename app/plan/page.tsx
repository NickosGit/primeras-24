import type { Metadata } from "next";
import { PlanView } from "@/components/PlanView";
import { copy } from "@/data/copy";

export const metadata: Metadata = {
  title: `Tu plan · ${copy.app.titulo}`,
};

export default function PlanPage() {
  return <PlanView />;
}
