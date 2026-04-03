defmodule PlatformPhxWeb.SceneSelectionTest do
  use ExUnit.Case, async: true

  alias PlatformPhxWeb.RegentScenes
  alias PlatformPhxWeb.SceneSelection

  test "selected_target_id returns the first marker id from a scene" do
    assert SceneSelection.selected_target_id(RegentScenes.overview_human_scene()) ==
             "platform:overview-human"

    assert SceneSelection.selected_target_id(RegentScenes.overview_agent_scene()) ==
             "platform:overview-agent"
  end

  test "selected_target_id returns nil when a scene has no markers" do
    assert SceneSelection.selected_target_id(%{}) == nil
    assert SceneSelection.selected_target_id(%{"faces" => []}) == nil
  end
end
