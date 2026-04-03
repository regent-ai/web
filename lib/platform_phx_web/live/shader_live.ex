defmodule PlatformPhxWeb.ShaderLive do
  use PlatformPhxWeb, :live_view

  @impl true
  @spec mount(map(), map(), Phoenix.LiveView.Socket.t()) ::
          {:ok, Phoenix.LiveView.Socket.t()}
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :page_title, "Shader")}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="shader"
      theme_class="rg-regent-theme-platform"
    >
      <div id="platform-shader-shell" class="rg-regent-theme-platform">
        <section>
          <div id="shader-root" phx-hook="ShaderRoot" phx-update="ignore"></div>
        </section>
      </div>
    </Layouts.app>
    """
  end
end
