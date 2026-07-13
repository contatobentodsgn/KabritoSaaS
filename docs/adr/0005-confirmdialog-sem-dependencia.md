# ADR-0005: `ConfirmDialog` é um componente hand-rolled sem dependências, não Radix Dialog

## Status

Accepted

## Contexto

O projeto já usa `shadcn/ui` (que embrulha Radix) em boa parte dos componentes
de `components/ui/`, então Radix Dialog seria a escolha natural para substituir
o `confirm()` nativo do navegador em fluxos destrutivos (rejeitar edição,
excluir conta, remover membro da equipe). Mas o caso de uso aqui é
deliberadamente pequeno: um diálogo modal de confirmação com título, descrição
opcional e dois botões — sem necessidade de portal customizável, animações
configuráveis, ou as demais primitivas que um Dialog genérico de biblioteca
expõe.

## Decisão

`ConfirmDialog` (`components/ui/confirm-dialog.tsx`) é implementado do zero, sem
dependência externa: estado controlado pelo consumidor (`open`/`onConfirm`/
`onCancel`), ESC e clique-fora cancelam, o scroll do `body` é travado enquanto
aberto, o foco vai para o painel e fica preso nele (Tab/Shift+Tab não escapa
para trás do overlay), e o foco volta a quem abriu o diálogo ao fechar.

## Consequências

Nenhuma dependência nova para um componente de ~80 linhas com comportamento
totalmente sob controle do time — mais fácil de auditar que uma API de
biblioteca genérica, e sem risco de breaking change de uma dependência externa
num fluxo usado em confirmações destrutivas. O custo é que qualquer requisito
de acessibilidade ou de interação que uma biblioteca madura já resolveria (casos
extremos de focus trap, `aria-*` adicionais, animações de entrada/saída) precisa
ser implementado e testado manualmente aqui, em vez de herdado.
