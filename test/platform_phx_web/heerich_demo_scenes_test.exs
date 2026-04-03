defmodule PlatformPhxWeb.HeerichDemoScenesTest do
  use ExUnit.Case, async: true

  alias PlatformPhxWeb.HeerichDemoScenes

  test "demo samples cover baseline, grouped, and split hover cycle variants" do
    samples = HeerichDemoScenes.samples()

    assert length(samples) == 9

    assert sample(samples, "default-primitive").scene
           |> hover_cycle_for_target("demo-default:anchor") == true

    explode_scene = sample(samples, "explode-cluster").scene

    assert hover_cycle_for_target(explode_scene, "demo-explode:crucible")["group"] ==
             "demo-explode-cluster"

    assert hover_cycle_for_target(explode_scene, "demo-explode:market")["group"] ==
             "demo-explode-cluster"

    assert hover_cycle_for_conduit(explode_scene, "demo-explode:edge:1")["group"] ==
             "demo-explode-cluster"

    marker_only_scene = sample(samples, "marker-only").scene
    polygons_only_scene = sample(samples, "polygons-only").scene

    assert hover_cycle_for_target(marker_only_scene, "demo-marker:eye")["includeMarker"] == true

    assert hover_cycle_for_target(marker_only_scene, "demo-marker:eye")["includePolygons"] ==
             false

    assert hover_cycle_for_target(polygons_only_scene, "demo-polygons:risk")["includeMarker"] ==
             false

    assert hover_cycle_for_target(polygons_only_scene, "demo-polygons:risk")["includePolygons"] ==
             true
  end

  test "knob atlas includes the main hover cycle controls and extra easing guidance" do
    rows = HeerichDemoScenes.knob_rows()

    assert {"enabled", _, _} = Enum.find(rows, fn {label, _, _} -> label == "enabled" end)
    assert {"group", _, _} = Enum.find(rows, fn {label, _, _} -> label == "group" end)
    assert {"loopDelayMs", _, _} = Enum.find(rows, fn {label, _, _} -> label == "loopDelayMs" end)

    assert {"includeMarker", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "includeMarker" end)

    assert {"includePolygons", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "includePolygons" end)

    assert {"easing", _, _} = Enum.find(rows, fn {label, _, _} -> label == "easing" end)
  end

  test "raw 0.7.1 samples expose scaling, carved walls, and restyling" do
    samples = HeerichDemoScenes.samples()

    scaled_scene = sample(samples, "scaled-voxels").scene
    carved_scene = sample(samples, "carved-walls").scene
    restyled_scene = sample(samples, "restyled-geometry").scene

    assert command_for_target(scaled_scene, "demo-scale:keystone")["scale"] == [0.72, 1, 0.72]
    assert command_for_target(scaled_scene, "demo-scale:keystone")["scaleOrigin"] == [0.5, 1, 0.5]

    assert Enum.any?(face_commands(carved_scene), fn command ->
             command["id"] == "demo-carve:void" and command["op"] == "remove"
           end)

    assert Enum.any?(face_commands(restyled_scene), fn command ->
             command["id"] == "demo-restyle:rail:hot" and command["op"] == "style"
           end)
  end

  test "feature atlas covers the new 0.7.1 primitives" do
    rows = HeerichDemoScenes.feature_rows()

    assert {"scale", _, _} = Enum.find(rows, fn {label, _, _} -> label == "scale" end)
    assert {"scaleOrigin", _, _} = Enum.find(rows, fn {label, _, _} -> label == "scaleOrigin" end)

    assert {"addGeometry(type: fill)", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "addGeometry(type: fill)" end)

    assert {"applyStyle(type: box / line)", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "applyStyle(type: box / line)" end)
  end

  defp sample(samples, id) do
    Enum.find(samples, fn sample -> sample.id == id end)
  end

  defp face_commands(%{"faces" => [%{"commands" => commands} | _rest]}), do: commands

  defp hover_cycle_for_target(scene, id) do
    scene
    |> face_commands()
    |> Enum.find(fn command -> command["targetId"] == id end)
    |> Map.fetch!("hoverCycle")
  end

  defp command_for_target(scene, id) do
    scene
    |> face_commands()
    |> Enum.find(fn command -> command["targetId"] == id end)
  end

  defp hover_cycle_for_conduit(scene, id) do
    scene
    |> face_commands()
    |> Enum.find(fn command ->
      String.starts_with?(command["id"], "#{id}:") or command["id"] == "#{id}:line"
    end)
    |> Map.fetch!("hoverCycle")
  end
end
