defmodule Regent.Panels do
  use Phoenix.Component

  @moduledoc """
  Canonical grouped Regent function components for human-readable panels and utility UI.
  """

  attr :id, :string, required: true
  attr :title, :string, required: true
  attr :subtitle, :string, default: nil
  attr :summary, :string, default: nil
  attr :class, :any, default: nil
  attr :rest, :global
  slot :actions
  slot :inner_block, required: true
  slot :footer

  def chamber(assigns) do
    ~H"""
    <section id={@id} class={["rg-chamber", @class]} {@rest}>
      <header class="rg-panel-header">
        <div>
          <h2 class="rg-panel-title">{@title}</h2>
          <p :if={@subtitle} class="rg-panel-subtitle">{@subtitle}</p>
          <p :if={@summary} class="rg-panel-summary">{@summary}</p>
        </div>
        <div :if={@actions != []} class="rg-panel-actions">{render_slot(@actions)}</div>
      </header>

      <div class="rg-panel-body">
        {render_slot(@inner_block)}
      </div>

      <footer :if={@footer != []} class="rg-panel-footer">
        {render_slot(@footer)}
      </footer>
    </section>
    """
  end

  attr :id, :string, required: true
  attr :title, :string, required: true
  attr :subtitle, :string, default: nil
  attr :kind, :string, default: "panel"
  attr :class, :any, default: nil
  attr :rest, :global
  slot :actions
  slot :inner_block, required: true
  slot :footer

  def ledger(assigns) do
    ~H"""
    <section id={@id} class={["rg-ledger", @class, "rg-ledger-#{@kind}"]} {@rest}>
      <header class="rg-panel-header">
        <div>
          <h2 class="rg-panel-title">{@title}</h2>
          <p :if={@subtitle} class="rg-panel-subtitle">{@subtitle}</p>
        </div>
        <div :if={@actions != []} class="rg-panel-actions">{render_slot(@actions)}</div>
      </header>

      <div class="rg-panel-body">
        {render_slot(@inner_block)}
      </div>

      <footer :if={@footer != []} class="rg-panel-footer">
        {render_slot(@footer)}
      </footer>
    </section>
    """
  end

  attr :name, :string, required: true
  attr :title, :string, default: nil
  attr :class, :any, default: nil
  attr :sprite_path, :string, default: "/regent/sigils/regent-sigils.svg"
  attr :rest, :global

  def icon(assigns) do
    ~H"""
    <svg
      class={["rg-icon", @class]}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={is_nil(@title)}
      {@rest}
    >
      <title :if={@title}>{@title}</title>
      <use href={"#{@sprite_path}##{@name}"} />
    </svg>
    """
  end
end
