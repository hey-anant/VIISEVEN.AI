import Hero from "@/components/custom/Hero";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <Hero/>
    </div>
  );
}
