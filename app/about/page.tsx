import type { Metadata } from "next";
import About from "@/src/components/About";

export const metadata: Metadata = {
  title: "Acerca de · Arcade Vault",
  description:
    "Conocé más sobre Arcade Vault y contactanos para sugerencias, propuestas de juegos o simplemente para saludar.",
};

export default function AboutPage() {
  return <About />;
}
