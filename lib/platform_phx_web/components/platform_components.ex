defmodule PlatformPhxWeb.PlatformComponents do
  @moduledoc false
  use Phoenix.Component
  use Regent

  @bootstrap_command """
  bunx @regent/cli my-agent
  cd my-agent && bun run dev
  """

  attr :card, :map, required: true
  attr :variant, :string, required: true

  def entry_card(assigns) do
    assigns = assign(assigns, :selected_target_id, Map.get(assigns.card, :selected_target_id))

    ~H"""
    <article
      id={"platform-entry-card-#{@card.id}-#{@variant}"}
      data-platform-card
      class={[
        "pp-entry-card",
        @card.theme_class
      ]}
    >
      <div class="pp-card-depth-stage" data-card-depth-stage>
        <.surface
          id={"entry-card-surface-#{@card.id}-#{@variant}"}
          class={"pp-card-surface pp-surface-single #{@card.theme_class}"}
          scene={@card.scene}
          scene_version={@card.scene_version}
          selected_target_id={@selected_target_id}
          theme={@card.theme}
          camera_distance={20}
          hook={if @variant == "home", do: "HomeRegentScene", else: "RegentScene"}
          data-home-logo-sequence={if @variant == "home", do: @card.sequence_index}
          data-home-logo-count={if @variant == "home", do: @card.sequence_count}
        />
      </div>

      <div class="pp-entry-card-copy">
        <div class="pp-entry-card-text">
          <p class="pp-entry-eyebrow">{@card.eyebrow}</p>
          <div class="space-y-3">
            <h2 class="pp-entry-title">{@card.title}</h2>
            <p :if={Map.has_key?(@card, :description_html)} class="pp-entry-description">
              {Phoenix.HTML.raw(@card.description_html)}
            </p>
            <p :if={!Map.has_key?(@card, :description_html)} class="pp-entry-description">
              {@card.description}
            </p>
          </div>
        </div>

        <div class="pp-entry-footer">
          <.link
            navigate={@card.href}
            class="pp-entry-link"
            aria-label={if @variant == "home", do: @card.cta_label, else: nil}
            title={if @variant == "home", do: @card.cta_label, else: nil}
            data-home-cta-root={@variant == "home"}
            data-background-suppress={if @variant == "home", do: true, else: nil}
          >
            <span class="pp-entry-link-visual" data-home-cta-visual={@variant == "home"}>
              <span
                :if={Map.get(@card, :logo_path)}
                class="pp-entry-link-logo"
                data-home-cta-logo={@variant == "home"}
                aria-hidden="true"
              >
                <img src={Map.get(@card, :logo_path)} alt="" />
              </span>
              <span
                :if={@variant != "home"}
                class="pp-entry-link-label"
              >
                {@card.cta_label}
              </span>
              <span
                class="pp-entry-link-arrow"
                data-home-cta-arrow={@variant == "home"}
                aria-hidden="true"
              >
                →
              </span>
            </span>
          </.link>
        </div>
      </div>
    </article>
    """
  end

  attr :title, :string, required: true
  attr :summary, :string, required: true
  attr :skill_label, :string, required: true
  attr :skill_command, :string, required: true
  attr :skill_note, :string, required: true

  def cli_bootstrap(assigns) do
    assigns = assign(assigns, :bootstrap_command, @bootstrap_command)

    ~H"""
    <section class="pp-cli-boot" aria-label={"#{@title} CLI setup"}>
      <div class="space-y-3">
        <p class="pp-home-kicker">Regent CLI</p>
        <h2 class="pp-route-panel-title">{@title}</h2>
        <p class="pp-panel-copy">{@summary}</p>
      </div>

      <div class="pp-cli-steps">
        <article class="pp-cli-step">
          <div class="space-y-2">
            <p class="pp-home-kicker">1. Scaffold + start</p>
            <p class="pp-panel-copy">
              Bootstrap a fresh Regent project locally, then bring up the starter flow.
            </p>
          </div>

          <code class="pp-command">{@bootstrap_command}</code>
        </article>

        <article class="pp-cli-step">
          <div class="space-y-2">
            <p class="pp-home-kicker">{@skill_label}</p>
            <p class="pp-panel-copy">{@skill_note}</p>
          </div>

          <code class="pp-command">{@skill_command}</code>
        </article>
      </div>
    </section>
    """
  end

  attr :variant, :string, default: "inline"
  attr :class, :string, default: nil
  attr :href, :string, default: nil
  attr :external, :boolean, default: true
  attr :tooltip, :string, default: "Access Soon"
  slot :inner_block, required: true

  def preview_link(assigns) do
    ~H"""
    <%= if @href do %>
      <a
        href={@href}
        target={if @external, do: "_blank", else: nil}
        rel={if @external, do: "noreferrer", else: nil}
        class={[
          "pp-preview-link",
          @variant == "pill" && "pp-link-button pp-link-button-slim pp-preview-link-pill",
          @variant == "pill-ghost" &&
            "pp-link-button pp-link-button-ghost pp-link-button-slim pp-preview-link-pill",
          @variant == "inline" && "pp-preview-link-inline",
          @variant == "list" && "pp-preview-link-list",
          @class
        ]}
      >
        {render_slot(@inner_block)}
      </a>
    <% else %>
      <span
        tabindex="0"
        role="link"
        aria-disabled="true"
        title={@tooltip}
        data-preview-text={@tooltip}
        class={[
          "pp-preview-link pp-preview-link-disabled",
          @variant == "pill" && "pp-link-button pp-link-button-slim pp-preview-link-pill",
          @variant == "pill-ghost" &&
            "pp-link-button pp-link-button-ghost pp-link-button-slim pp-preview-link-pill",
          @variant == "inline" && "pp-preview-link-inline",
          @variant == "list" && "pp-preview-link-list",
          @class
        ]}
      >
        {render_slot(@inner_block)}
      </span>
    <% end %>
    """
  end

  attr :sample, :map, required: true

  def hover_cycle_demo(assigns) do
    ~H"""
    <article
      id={"platform-heerich-demo-#{@sample.id}"}
      class={[
        "pp-demo-card",
        @sample.theme_class
      ]}
      data-demo-card
    >
      <div class="pp-demo-card-copy">
        <div class="space-y-3">
          <p class="pp-entry-eyebrow">{@sample.eyebrow}</p>
          <div class="space-y-3">
            <h2 class="pp-route-panel-title">{@sample.title}</h2>
            <p class="pp-panel-copy">{@sample.description}</p>
          </div>
        </div>

        <.surface
          id={"platform-heerich-demo-surface-#{@sample.id}"}
          class={"pp-demo-surface pp-surface-single #{@sample.theme_class}"}
          scene={@sample.scene}
          scene_version={@sample.scene_version}
          selected_target_id={@sample.selected_target_id}
          theme={@sample.theme}
          camera_distance={@sample.camera_distance}
        />

        <dl class="pp-demo-settings" aria-label={"#{@sample.title} settings"}>
          <%= for {label, value} <- @sample.settings do %>
            <div>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          <% end %>
        </dl>

        <p class="pp-demo-note">{@sample.note}</p>
      </div>
    </article>
    """
  end

  attr :scene_id, :string, required: true
  attr :theme, :string, required: true
  attr :theme_class, :string, required: true
  attr :scene, :map, required: true
  attr :scene_version, :integer, required: true
  attr :selected_target_id, :string, default: nil
  attr :sequence_index, :integer, required: true
  attr :sequence_count, :integer, required: true
  attr :camera_distance, :integer, default: 20

  def demo_surface(assigns) do
    ~H"""
    <div class={["pp-scene-demo-slot", @theme_class]}>
      <.surface
        id={"demo-surface-#{@scene_id}"}
        class={"pp-scene-demo-surface pp-surface-single #{@theme_class}"}
        scene={@scene}
        scene_version={@scene_version}
        selected_target_id={@selected_target_id}
        theme={@theme}
        camera_distance={@camera_distance}
        hook="AnimatedHomeLogoScene"
        data-home-logo-sequence={@sequence_index}
        data-home-logo-count={@sequence_count}
      />
    </div>
    """
  end
end
