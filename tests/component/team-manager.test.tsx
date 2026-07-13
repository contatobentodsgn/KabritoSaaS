// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamManager } from "@/components/forms/team-manager";
import {
  addMemberAction,
  setMemberRoleAction,
  removeMemberAction,
} from "@/server/actions/team";
import { toast } from "sonner";
import type { TeamMember } from "@/server/admin/team/members";

/**
 * Gestão de equipe (convite/papel/remoção) — a mais sensível dos 3 forms
 * críticos por mexer em permissões de outros usuários. Mocka as Server
 * Actions, o router (para o refresh() pós-mutação) e o toast.
 */
vi.mock("@/server/actions/team", () => ({
  addMemberAction: vi.fn(),
  setMemberRoleAction: vi.fn(),
  removeMemberAction: vi.fn(),
  cancelInviteAction: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockedAddMember = vi.mocked(addMemberAction);
const mockedSetRole = vi.mocked(setMemberRoleAction);
const mockedRemoveMember = vi.mocked(removeMemberAction);

const members: TeamMember[] = [
  {
    userId: "u-owner",
    name: "Dona da Conta",
    email: "owner@ex.com",
    role: "owner",
  },
  {
    userId: "u-member",
    name: "Membro Um",
    email: "membro@ex.com",
    role: "member",
  },
];

describe("TeamManager", () => {
  beforeEach(() => {
    mockedAddMember.mockReset();
    mockedSetRole.mockReset();
    mockedRemoveMember.mockReset();
    mockRefresh.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("esconde o formulário de convite e os controles de papel quando canManage é falso", () => {
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={false} />,
    );

    expect(
      screen.queryByRole("heading", { name: "Convidar por e-mail" }),
    ).not.toBeInTheDocument();
    // Sem canManage, membro não-owner vira badge, não <select> de papel.
    expect(screen.queryByLabelText("Papel")).not.toBeInTheDocument();
  });

  it("não envia o convite quando o e-mail está vazio (validação nativa required)", async () => {
    const user = userEvent.setup();
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={true} />,
    );

    await user.click(screen.getByRole("button", { name: "Convidar" }));

    expect(mockedAddMember).not.toHaveBeenCalled();
  });

  it("convida um membro válido, mostra toast de sucesso e atualiza a lista", async () => {
    mockedAddMember.mockResolvedValue({ ok: true, status: "invited" });
    const user = userEvent.setup();
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={true} />,
    );

    await user.type(screen.getByLabelText("E-mail"), "novo@agencia.com");
    await user.click(screen.getByRole("button", { name: "Convidar" }));

    await waitFor(() =>
      expect(mockedAddMember).toHaveBeenCalledWith({
        email: "novo@agencia.com",
        role: "member",
      }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("mostra um toast de erro quando o convite falha", async () => {
    mockedAddMember.mockResolvedValue({
      ok: false,
      error: "Muitos convites em pouco tempo. Aguarde um instante.",
    });
    const user = userEvent.setup();
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={true} />,
    );

    await user.type(screen.getByLabelText("E-mail"), "novo@agencia.com");
    await user.click(screen.getByRole("button", { name: "Convidar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Muitos convites em pouco tempo. Aguarde um instante.",
      ),
    );
  });

  it("troca o papel de um membro via select", async () => {
    mockedSetRole.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={true} />,
    );

    // Duas <select> chamadas "Papel" existem (linha do membro + form de
    // convite) — escopa ao <li> do membro para pegar a certa.
    const memberRow = screen.getByText("membro@ex.com").closest("li")!;
    const roleSelect = within(memberRow).getByRole("combobox");
    await user.selectOptions(roleSelect, "admin");

    await waitFor(() =>
      expect(mockedSetRole).toHaveBeenCalledWith({
        userId: "u-member",
        role: "admin",
      }),
    );
  });

  it("abre o diálogo de confirmação ao remover e chama a action ao confirmar", async () => {
    mockedRemoveMember.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <TeamManager members={members} pendingInvites={[]} canManage={true} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remover membro@ex.com" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Remover do workspace?",
    });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    await waitFor(() =>
      expect(mockedRemoveMember).toHaveBeenCalledWith({ userId: "u-member" }),
    );
    expect(toast.success).toHaveBeenCalled();
  });
});
