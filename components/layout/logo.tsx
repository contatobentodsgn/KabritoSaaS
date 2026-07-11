import Image from "next/image";

/**
 * Par claro/escuro do logo — dimensões reais do SVG (220x48) evitam CLS;
 * `className` controla o tamanho renderizado (h-X w-auto sobrepõe via CSS).
 */
export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/logo-kabrito.svg"
        alt="Kabrito"
        width={220}
        height={48}
        priority
        className={`${className} dark:hidden`}
      />
      <Image
        src="/brand/logo-kabrito-inverse.svg"
        alt="Kabrito"
        width={220}
        height={48}
        priority
        className={`hidden ${className} dark:block`}
      />
    </>
  );
}
