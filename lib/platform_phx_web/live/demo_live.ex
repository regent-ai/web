defmodule PlatformPhxWeb.DemoLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.RegentScenes
  alias PlatformPhxWeb.SceneSelection

  @scene_specs [
    %{id: "techtree", theme: "techtree", theme_class: "rg-regent-theme-techtree"},
    %{id: "dashboard", theme: "platform", theme_class: "rg-regent-theme-platform"},
    %{id: "autolaunch", theme: "autolaunch", theme_class: "rg-regent-theme-autolaunch"}
  ]

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, page_title: "Demo", demo_scenes: build_demo_scenes())}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:none}
      theme_class="rg-regent-theme-platform"
      content_class="p-0"
    >
      <div id="platform-demo-shell" class="pp-scene-demo-shell">
        <main id="platform-demo-stage" class="pp-scene-demo-stage" aria-label="Regents voxel demo">
          <section class="pp-scene-demo-grid" aria-label="Home voxel structures">
            <%= for scene <- @demo_scenes do %>
              <.demo_surface
                scene_id={scene.id}
                theme={scene.theme}
                theme_class={scene.theme_class}
                scene={scene.scene}
                scene_version={scene.scene_version}
                selected_target_id={scene.selected_target_id}
                sequence_index={scene.sequence_index}
                sequence_count={scene.sequence_count}
              />
            <% end %>
          </section>
        </main>
      </div>
    </Layouts.app>
    """
  end

  @impl true
  def handle_event(event, _params, socket)
      when event in ["regent:node_hover", "regent:surface_ready"] do
    {:noreply, socket}
  end

  defp build_demo_scenes do
    total = length(@scene_specs)

    Enum.with_index(@scene_specs, fn spec, index ->
      scene = RegentScenes.home_scene(spec.id)

      spec
      |> Map.put(:scene, scene)
      |> Map.put(:scene_version, scene["sceneVersion"] || 1)
      |> Map.put(:selected_target_id, SceneSelection.selected_target_id(scene))
      |> Map.put(:sequence_index, index)
      |> Map.put(:sequence_count, total)
    end)
  end
end
