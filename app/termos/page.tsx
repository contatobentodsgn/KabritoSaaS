import Link from "next/link";

// ISR (PERF-8): mesmo motivo do app/privacy/page.tsx (par legal) — a rota é
// dinâmica por causa do headers() no layout raiz (nonce da CSP), não por
// nada nesta página. `revalidate` não ativa cache HTTP hoje por isso, mas
// documenta a intenção para quando a rota deixar de depender de headers().
export const revalidate = 86400;

export const metadata = {
  title: "Termos de Uso · Inteligência Criativa",
  description:
    "Termos de uso da Kabrito: condições de acesso e utilização da plataforma de inteligência criativa.",
};

/** Termos de uso públicos do serviço (par da Política de Privacidade). */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Início
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground">
        Última atualização: 2026-06-14. Ao criar uma conta ou usar o serviço,
        você concorda com estes termos e com a{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">1. O serviço</h2>
        <p>
          A Inteligência Criativa entrega conteúdo editorial — pautas, copy,
          headlines, prompts e calendário — gerado com apoio de IA e{" "}
          <strong>revisado por pessoas antes de publicar</strong>. Nada é
          publicado automaticamente sem aprovação humana. O conteúdo é material
          de apoio à sua criação, não aconselhamento profissional.
        </p>

        <h2 className="text-lg font-semibold">2. Conta e responsabilidades</h2>
        <p>
          Você é responsável por manter suas credenciais em segurança e por todo
          uso feito na sua conta. Por segurança, o acesso é limitado a um número
          de dispositivos simultâneos; ao exceder, a sessão mais antiga é
          encerrada. Forneça dados verdadeiros no cadastro.
        </p>

        <h2 className="text-lg font-semibold">3. Assinatura e acesso</h2>
        <p>
          O acesso ao conteúdo depende de uma assinatura ativa (plano único). O
          acesso permanece disponível enquanto a assinatura estiver ativa e é
          interrompido quando ela termina. Você pode cancelar a qualquer
          momento; o cancelamento encerra a renovação seguinte, sem reembolso de
          período já em curso, salvo exigência legal.
        </p>

        <h2 className="text-lg font-semibold">4. Uso aceitável</h2>
        <p>
          Você concorda em não revender ou redistribuir o serviço, não tentar
          burlar limites técnicos (incluindo os de geração sob demanda), não
          fazer engenharia reversa e não usar o serviço para fins ilícitos. O
          uso abusivo pode levar à suspensão da conta.
        </p>

        <h2 className="text-lg font-semibold">5. Conteúdo e propriedade</h2>
        <p>
          O conteúdo editorial é fornecido para uso no seu próprio negócio. Você
          é responsável por revisar, adaptar e validar o material — inclusive o
          gerado sob demanda — antes de publicá-lo em seus canais. Marcas e
          materiais de terceiros pertencem a seus respectivos titulares.
        </p>

        <h2 className="text-lg font-semibold">6. Isenção de garantias</h2>
        <p>
          O conteúdo gerado por IA pode conter imprecisões e é entregue
          &quot;como está&quot;. Não garantimos resultados específicos de
          desempenho, alcance ou conversão. Revise sempre antes de usar.
        </p>

        <h2 className="text-lg font-semibold">
          7. Limitação de responsabilidade
        </h2>
        <p>
          Na máxima extensão permitida pela lei, não respondemos por danos
          indiretos, lucros cessantes ou decisões tomadas com base no conteúdo.
          Nossa responsabilidade total fica limitada ao valor pago nos 12 meses
          anteriores ao evento.
        </p>

        <h2 className="text-lg font-semibold">8. Encerramento</h2>
        <p>
          Você pode encerrar sua conta a qualquer momento em{" "}
          <strong>Configurações → Excluir conta</strong>, o que anonimiza/apaga
          seus dados pessoais conforme a{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
          . Podemos suspender contas que violem estes termos.
        </p>

        <h2 className="text-lg font-semibold">9. Alterações</h2>
        <p>
          Podemos atualizar estes termos; mudanças relevantes serão comunicadas.
          O uso continuado após a atualização significa concordância com a nova
          versão.
        </p>

        <h2 className="text-lg font-semibold">10. Lei aplicável e foro</h2>
        <p>
          Estes termos são regidos pelas leis do Brasil. Fica eleito o foro do
          domicílio do consumidor para dirimir controvérsias.
        </p>

        <h2 className="text-lg font-semibold">11. Contato</h2>
        <p>contato@kabritodigital.com</p>
      </section>
    </main>
  );
}
