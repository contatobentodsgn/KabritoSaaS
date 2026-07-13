// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/forms/login-form";
import { signInAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";

/**
 * Mocka a Server Action de login — o teste controla o retorno sem tocar
 * Supabase/DB real. Padrão a repetir para os outros forms críticos.
 */
vi.mock("@/server/actions/auth", () => ({
  signInAction: vi.fn(),
}));

const mockedSignIn = vi.mocked(signInAction);

describe("LoginForm", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
  });

  it("não envia a action quando e-mail e senha estão vazios (validação nativa required)", async () => {
    mockedSignIn.mockResolvedValue(emptyFormState);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("envia e-mail e senha preenchidos para a action", async () => {
    mockedSignIn.mockResolvedValue(emptyFormState);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "Senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mockedSignIn).toHaveBeenCalledTimes(1));
    const formData = mockedSignIn.mock.calls[0]![1];
    expect(formData.get("email")).toBe("user@example.com");
    expect(formData.get("password")).toBe("Senha123");
  });

  it("renderiza o erro de campo devolvido pela action com role=alert", async () => {
    mockedSignIn.mockResolvedValue({
      fieldErrors: { email: ["E-mail inválido."] },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "Senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("E-mail inválido.");
  });

  it("renderiza o erro geral (credenciais inválidas) com role=alert", async () => {
    mockedSignIn.mockResolvedValue({ error: "E-mail ou senha inválidos." });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaErrada1");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("E-mail ou senha inválidos.");
  });

  it("desabilita o botão de submit e mostra o texto de carregamento enquanto a action está pendente", async () => {
    let resolveAction!: (v: typeof emptyFormState) => void;
    mockedSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "Senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Entrando...",
    });
    expect(pendingButton).toBeDisabled();

    resolveAction(emptyFormState);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Entrar" })).not.toBeDisabled(),
    );
  });
});
