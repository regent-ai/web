defmodule PlatformPhxWeb.RegentScenesTest do
  use ExUnit.Case, async: true

  alias PlatformPhxWeb.RegentScenes

  test "unknown focus values fall back to the default section" do
    assert RegentScenes.techtree_focus("unknown") == "observatory"
    assert RegentScenes.autolaunch_focus(nil) == "launch"
    assert RegentScenes.dashboard_focus("wrong") == "session"
  end

  test "autolaunch content replaces board placeholders with counts" do
    content = RegentScenes.autolaunch_content("market", 4, 9)

    assert {"Current board", "4"} in content.table
    assert {"Past board", "9"} in content.table
  end

  test "bridge scenes focus the selected target" do
    techtree_scene = RegentScenes.techtree_bridge("review", 3)
    autolaunch_scene = RegentScenes.autolaunch_bridge(2, 7, "settlement", 5)
    dashboard_scene = RegentScenes.dashboard_header("guardrails", 8)

    assert focused_target_id(techtree_scene) == "techtree:review"
    assert focused_target_id(autolaunch_scene) == "autolaunch:settlement"
    assert focused_target_id(dashboard_scene) == "platform:guardrails"
  end

  test "home scenes keep the voxel marks static and cream-only" do
    techtree_scene = RegentScenes.home_scene("techtree")
    autolaunch_scene = RegentScenes.home_scene("autolaunch")
    dashboard_scene = RegentScenes.home_scene("dashboard")

    refute hover_cycle_for_target(techtree_scene, "techtree:home-logo")
    refute hover_cycle_for_target(autolaunch_scene, "autolaunch:home-logo")
    refute hover_cycle_for_target(dashboard_scene, "platform:home-logo")

    [face] = autolaunch_scene["faces"]

    assert Enum.all?(face["commands"], fn command ->
             command["targetId"] == "autolaunch:home-logo" and
               not Map.has_key?(command, "hoverCycle")
           end)
  end

  test "platform scenes forward the shared interaction marker fields" do
    techtree_scene = RegentScenes.home_scene("techtree")
    bridge_scene = RegentScenes.techtree_bridge("review", 3)

    home_marker = marker_for_target(techtree_scene, "techtree:home-logo")
    bridge_marker = marker_for_target(bridge_scene, "techtree:review")

    assert home_marker["intent"] == "navigate"
    assert home_marker["actionLabel"] == "Open Techtree"
    assert home_marker["groupRole"] == "landmark"

    assert bridge_marker["intent"] == "scene_action"
    assert bridge_marker["actionLabel"] == "Focus Review vault"
    assert bridge_marker["groupRole"] == "landmark"
  end

  test "overview scenes expose one calm, non-navigable landmark each" do
    human_scene = RegentScenes.overview_human_scene()
    agent_scene = RegentScenes.overview_agent_scene()

    human_marker = marker_for_target(human_scene, "platform:overview-human")
    agent_marker = marker_for_target(agent_scene, "platform:overview-agent")

    assert human_marker["intent"] == "status_only"
    assert human_marker["groupRole"] == "landmark"
    assert human_marker["status"] == "focused"
    assert hover_cycle_for_target(human_scene, "platform:overview-human")["mode"] == "phase"

    assert agent_marker["intent"] == "status_only"
    assert agent_marker["groupRole"] == "landmark"
    assert agent_marker["status"] == "focused"
    assert hover_cycle_for_target(agent_scene, "platform:overview-agent")["mode"] == "phase"
  end

  defp focused_target_id(%{"faces" => [%{"markers" => markers} | _rest]}) do
    markers
    |> Enum.find(fn marker -> marker["status"] == "focused" end)
    |> Map.fetch!("id")
  end

  defp hover_cycle_for_target(%{"faces" => [%{"commands" => commands} | _rest]}, id) do
    commands
    |> Enum.find(fn command -> command["targetId"] == id end)
    |> Map.get("hoverCycle")
  end

  defp marker_for_target(%{"faces" => [%{"markers" => markers} | _rest]}, id) do
    Enum.find(markers, fn marker -> marker["id"] == id end)
  end
end
