defmodule PlatformPhxWeb.RegentCliLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.RegentCliCatalog

  @impl true
  def mount(_params, _session, socket) do
    intro = RegentCliCatalog.intro()
    quick_start = RegentCliCatalog.quick_start()
    quick_start_note = RegentCliCatalog.quick_start_note()
    techtree_start_intro = RegentCliCatalog.techtree_start_intro()
    techtree_start_steps = RegentCliCatalog.techtree_start_steps()
    mental_model = RegentCliCatalog.mental_model()
    common_rules = RegentCliCatalog.common_rules()
    first_command_groups = RegentCliCatalog.first_command_groups()
    guidance = RegentCliCatalog.guidance()

    {:ok,
     socket
     |> assign(:page_title, "Regent CLI")
     |> assign(:intro, intro)
     |> assign(:quick_start, quick_start)
     |> assign(:quick_start_note, quick_start_note)
     |> assign(:techtree_start_intro, techtree_start_intro)
     |> assign(:techtree_start_steps, techtree_start_steps)
     |> assign(:mental_model, mental_model)
     |> assign(:common_rules, common_rules)
     |> assign(:first_command_groups, first_command_groups)
     |> assign(:guidance, guidance)
     |> assign(
       :page_markdown,
       cli_markdown(
         intro,
         quick_start,
         quick_start_note,
         techtree_start_intro,
         techtree_start_steps,
         mental_model,
         common_rules,
         first_command_groups,
         guidance
       )
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="regent-cli"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-regent-cli-shell"
        class="pp-route-shell rg-regent-theme-platform"
        phx-hook="BridgeReveal"
      >
        <div class="pp-route-stage">
          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-route-panel-span">
              <div class="pp-route-panel-heading">
                <div class="space-y-3">
                  <p class="pp-home-kicker">Regent CLI</p>
                  <h2 class="pp-route-panel-title">
                    Local runtime and operator surface for <code>@regentlabs/cli</code>.
                  </h2>
                </div>
                <button
                  id="platform-regent-cli-markdown-copy"
                  type="button"
                  phx-hook="ClipboardCopy"
                  class="pp-copy-chip pp-copy-chip--wide"
                  aria-label="Copy Regent CLI page as markdown"
                  title="Copy Regent CLI page as markdown"
                  data-copy-text={@page_markdown}
                >
                  <span>Copy page as markdown</span>
                  <span class="pp-copy-chip-icon" aria-hidden="true">
                    <.icon name="hero-document-duplicate" class="size-4" />
                  </span>
                </button>
              </div>

              <%= for paragraph <- @intro do %>
                <p class="pp-panel-copy">{paragraph}</p>
              <% end %>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel">
              <p class="pp-home-kicker">Quick start</p>
              <h2 class="pp-route-panel-title">
                Start with the package, create local state, write the wallet export, then open the guided Techtree flow.
              </h2>
              <pre class="pp-product-cli-command">{Enum.join(@quick_start, "\n")}</pre>
              <p class="pp-panel-copy">{@quick_start_note}</p>
            </article>

            <article class="pp-route-panel">
              <p class="pp-home-kicker">Best first command</p>
              <h2 class="pp-route-panel-title">
                What <code>regent techtree start</code> does
              </h2>
              <p class="pp-panel-copy">{@techtree_start_intro}</p>
              <ul class="pp-fact-list">
                <%= for step <- @techtree_start_steps do %>
                  <li>{step}</li>
                <% end %>
              </ul>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel">
              <p class="pp-home-kicker">Mental model</p>
              <h2 class="pp-route-panel-title">
                Think of Regent CLI as the local control layer for the Regent stack.
              </h2>
              <ul class="pp-fact-list">
                <%= for {command, body} <- @mental_model do %>
                  <li>
                    {Phoenix.HTML.raw(command)} {body}
                  </li>
                <% end %>
              </ul>
            </article>

            <article class="pp-route-panel">
              <p class="pp-home-kicker">Common rules</p>
              <h2 class="pp-route-panel-title">
                The CLI is JSON-first, daemon-aware, and happiest when local state is explicit.
              </h2>
              <ul class="pp-fact-list">
                <%= for rule <- @common_rules do %>
                  <li>{Phoenix.HTML.raw(rule)}</li>
                <% end %>
              </ul>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-route-panel-span">
              <p class="pp-home-kicker">First commands to know</p>
              <h2 class="pp-route-panel-title">
                Learn the first commands by task, not by trying to memorize the whole surface.
              </h2>
              <div class="pp-product-cli-grid pp-product-cli-grid--two-up">
                <%= for group <- @first_command_groups do %>
                  <section class="pp-product-cli-card">
                    <p class="pp-home-kicker">{group.title}</p>
                    <pre class="pp-product-cli-command">{Enum.join(group.commands, "\n")}</pre>
                    <p class="pp-panel-copy">{Phoenix.HTML.raw(group.body)}</p>
                  </section>
                <% end %>
              </div>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel">
              <p class="pp-home-kicker">Guidance for humans and agents</p>
              <h2 class="pp-route-panel-title">
                Use the guided path first, then drop lower only when you need tighter control.
              </h2>
              <ul class="pp-fact-list">
                <%= for item <- @guidance do %>
                  <li>{Phoenix.HTML.raw(item)}</li>
                <% end %>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp cli_markdown(
         intro,
         quick_start,
         quick_start_note,
         techtree_start_intro,
         techtree_start_steps,
         mental_model,
         common_rules,
         first_command_groups,
         guidance
       ) do
    [
      "# Regent CLI",
      "",
      intro,
      "",
      "## Quick start",
      "",
      "```bash",
      quick_start,
      "```",
      "",
      quick_start_note,
      "",
      "## What `regent techtree start` does",
      "",
      techtree_start_intro,
      ""
    ]
    |> Kernel.++(Enum.map(techtree_start_steps, &"- #{&1}"))
    |> Kernel.++([
      "",
      "## Mental model",
      "",
      "Think of Regent CLI as the local control layer for the Regent stack.",
      ""
    ])
    |> Kernel.++(
      Enum.map(mental_model, fn {command, body} ->
        "- #{String.replace(command, "`", "")} #{body}"
      end)
    )
    |> Kernel.++([
      "",
      "## Common rules",
      ""
    ])
    |> Kernel.++(Enum.map(common_rules, &"- #{strip_backticks(&1)}"))
    |> Kernel.++([
      "",
      "## First commands to know",
      ""
    ])
    |> Kernel.++(
      Enum.flat_map(first_command_groups, fn group ->
        [
          "### #{group.title}",
          "",
          "```bash",
          Enum.join(group.commands, "\n"),
          "```",
          "",
          strip_backticks(group.body),
          ""
        ]
      end)
    )
    |> Kernel.++([
      "## Guidance for humans and agents",
      ""
    ])
    |> Kernel.++(Enum.map(guidance, &"- #{strip_backticks(&1)}"))
    |> List.flatten()
    |> Enum.join("\n")
  end

  defp strip_backticks(text) when is_binary(text) do
    String.replace(text, "`", "")
  end
end
