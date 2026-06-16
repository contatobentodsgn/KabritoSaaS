/**
 * Template (não layout): REMONTA a cada navegação, então a animação de entrada
 * toca toda vez. Fade + leve subida via tailwindcss-animate (CSS puro, sem JS).
 * Combina com loading.tsx: skeleton enquanto carrega → conteúdo entra suave.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      {children}
    </div>
  );
}
