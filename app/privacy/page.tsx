import Link from "next/link";

export const metadata = { title: "Política de Privacidade · Inteligência Criativa" };

/** Política de privacidade pública (LGPD — SECURITY_GUIDE §10). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Início
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground">
        Última atualização: 2026-06-13. Conforme a Lei Geral de Proteção de
        Dados (LGPD, Lei 13.709/2018).
      </p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">1. Dados que coletamos</h2>
        <p>
          Coletamos apenas o necessário (minimização): nome e e-mail (cadastro),
          e — para segurança/auditoria — endereço IP e user-agent das sessões.
          Não coletamos dados de redes sociais de terceiros nem fazemos scraping.
        </p>

        <h2 className="text-lg font-semibold">2. Base legal e finalidade</h2>
        <p>
          Tratamos os dados para executar o contrato (acesso à assinatura), com
          base no consentimento do cadastro e no legítimo interesse de segurança.
        </p>

        <h2 className="text-lg font-semibold">3. Retenção</h2>
        <p>
          Conteúdo editorial respeita a retenção do plano. Sinais brutos
          (raw_signals) e logs de acesso/auditoria são limpos automaticamente
          após a janela definida (rotina diária de ciclo de vida).
        </p>

        <h2 className="text-lg font-semibold">4. Seus direitos</h2>
        <p>
          Você pode acessar, corrigir e excluir seus dados. A exclusão de conta
          está disponível em <strong>Configurações → Excluir conta</strong>, que
          anonimiza/apaga os dados pessoais e encerra suas sessões.
        </p>

        <h2 className="text-lg font-semibold">5. Segurança</h2>
        <p>
          Aplicamos isolamento por usuário no banco (RLS), autorização no
          servidor e segregação de segredos. Detalhes técnicos no nosso guia de
          segurança interno.
        </p>

        <h2 className="text-lg font-semibold">6. Contato do encarregado (DPO)</h2>
        <p>privacidade@example.com</p>

        <p className="pt-2">
          Veja também os{" "}
          <Link href="/termos" className="text-primary hover:underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
