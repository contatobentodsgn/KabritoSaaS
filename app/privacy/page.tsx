import Link from "next/link";

// ISR (PERF-8): a rota já sai "ƒ" (dinâmica) no build não por nada nesta
// página, mas porque o layout raiz (app/layout.tsx) lê headers() para o nonce
// da CSP do seu próprio script anti-flash de tema — isso força renderização
// dinâmica em toda rota do app (mesmo caso do app/page.tsx, ver PR).
// `revalidate` não ativa cache HTTP aqui hoje por esse motivo, mas documenta
// a intenção: conteúdo legal muda raramente, 24h é uma janela segura assim
// que a rota deixar de depender de uma Dynamic API.
export const revalidate = 86400;

export const metadata = {
  title: "Política de Privacidade · Inteligência Criativa",
};

/** Política de privacidade pública (LGPD — SECURITY_GUIDE §10). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Início
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="text-sm text-muted-foreground">
        Última atualização: 2026-06-13. Conforme a Lei Geral de Proteção de
        Dados (LGPD, Lei 13.709/2018).
      </p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">1. Dados que coletamos</h2>
        <p>
          Coletamos apenas o necessário (minimização): nome e e-mail (cadastro),
          e — para segurança/auditoria — endereço IP e user-agent das sessões.
          Não coletamos dados de redes sociais de terceiros nem fazemos
          scraping.
        </p>

        <h2 className="text-lg font-semibold">2. Base legal e finalidade</h2>
        <p>
          Tratamos os dados para executar o contrato (acesso à assinatura), com
          base no consentimento do cadastro e no legítimo interesse de
          segurança.
        </p>

        <h2 className="text-lg font-semibold">3. Retenção</h2>
        <p>
          Conteúdo editorial respeita a retenção do plano. Sinais brutos
          (raw_signals) e logs de acesso/auditoria são limpos automaticamente
          após a janela definida (rotina diária de ciclo de vida).
        </p>

        <h2 className="text-lg font-semibold">4. Seus direitos</h2>
        <p>
          Você pode acessar, corrigir, <strong>exportar</strong> e excluir seus
          dados. A exportação (portabilidade) está em{" "}
          <strong>
            Configurações → Privacidade e dados → Baixar meus dados
          </strong>
          , e a exclusão em <strong>Configurações → Excluir conta</strong>, que
          anonimiza/apaga os dados pessoais e encerra suas sessões.
        </p>

        <h2 className="text-lg font-semibold">5. Sub-processadores</h2>
        <p>
          Para operar o serviço, compartilhamos dados estritamente necessários
          com fornecedores que atuam como operadores: <strong>Supabase</strong>{" "}
          (banco de dados e autenticação), <strong>Vercel</strong> (hospedagem),{" "}
          <strong>Upstash</strong> (rate-limit), <strong>Resend</strong> (e-mail
          transacional), <strong>Sentry</strong> (monitoramento de erros) e{" "}
          <strong>Have I Been Pwned</strong> (checagem de senha vazada, via
          k-anonimato — a senha nunca é enviada). Alguns deles processam dados
          fora do Brasil (transferência internacional), com as salvaguardas
          contratuais dos respectivos fornecedores.
        </p>

        <h2 className="text-lg font-semibold">6. Segurança</h2>
        <p>
          Aplicamos isolamento por usuário no banco (RLS), autorização no
          servidor e segregação de segredos. Detalhes técnicos no nosso guia de
          segurança interno.
        </p>

        <h2 className="text-lg font-semibold">
          7. Contato do encarregado (DPO)
        </h2>
        <p>privacidade@kabritodigital.com</p>

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
