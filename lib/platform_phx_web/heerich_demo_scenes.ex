defmodule PlatformPhxWeb.HeerichDemoScenes do
  @moduledoc false

  def samples do
    [
      default_sample(),
      collapse_sample(),
      explode_sample(),
      phase_sample(),
      marker_only_sample(),
      polygons_only_sample()
    ]
  end

  def knob_rows do
    [
      {"enabled",
       "Turns the primitive on or off. `true` uses the shared defaults; `false` keeps the voxel still.",
       "Baseline sample + any scene you want to suppress."},
      {"mode",
       "Picks the destruction style. `collapse` pulls inward, `explode` throws faces outward, `phase` slides and ghosts upward.",
       "Collapse / grouped explode / operator phase."},
      {"group", "Shapes with the same group key cycle together when any one of them is hovered.",
       "Grouped launch cluster."},
      {"durationMs", "Sets the total length of one destroy-and-rebuild loop.",
       "All six samples use different timings."},
      {"loopDelayMs",
       "Adds a pause between loops so the effect can breathe instead of firing continuously.",
       "Operator phase and marker-only glyph."},
      {"staggerMs",
       "Offsets each face a little so the break and rebuild can feel more mechanical or more ceremonial.",
       "Grouped launch cluster."},
      {"easing",
       "Changes the acceleration curve. The default is even and calm; a tighter easing makes the loop feel sharper.",
       "Operator phase uses a tighter curve."},
      {"fill", "Temporarily tints the voxel faces during the destruction pass.",
       "Collapse, explode, phase, and polygons-only."},
      {"stroke", "Temporarily changes the face outline color during the cycle.",
       "Collapse, explode, phase, and polygons-only."},
      {"opacity", "Controls how far the voxel fades out at the midpoint.",
       "Every sample after the baseline."},
      {"scale", "Changes how much the shape shrinks or expands at the break point.",
       "Collapse shrinks harder; explode pushes larger."},
      {"translate", "Controls how far the faces drift during the effect.",
       "Explode pushes farthest, phase stays restrained."},
      {"shadow", "Adds glow or bloom during the active part of the loop.",
       "Collapse, explode, phase, and marker-only."},
      {"includeMarker", "Decides whether the sigil overlay joins the loop.",
       "Marker-only turns it on by itself; polygons-only leaves it out."},
      {"includePolygons", "Decides whether the voxel faces themselves animate.",
       "Marker-only turns it off; the other samples keep it on."}
    ]
  end

  def primer_rules do
    [
      "HoverCycle stays in the shared Regent layer, so every sample here uses the same primitive as the real product surfaces.",
      "Hovering any shape in a group wakes the whole group. That is how clustered launch surfaces can tear apart together.",
      "Marker and polygon motion can be split. That lets you animate only the sigil, only the voxel mass, or both together.",
      "Reduced-motion settings keep the scenes readable and interactive, but stop the looping animation."
    ]
  end

  defp default_sample do
    sample(
      "default-primitive",
      %{
        eyebrow: "Default / 1 second loop",
        title: "Baseline cube",
        description:
          "This is the smallest possible HoverCycle setup: turn it on with `true` and let the shared defaults run the one-second collapse and rebuild loop.",
        note:
          "Hover the front cube. It uses the shared default timing and animates both the voxel mass and the sigil.",
        theme: "platform",
        theme_class: "rg-regent-theme-platform",
        camera_distance: 19,
        settings: [
          {"enabled", "true"},
          {"mode", "collapse (default)"},
          {"durationMs", "1000"},
          {"includeMarker", "true"},
          {"includePolygons", "true"}
        ]
      },
      scene(
        "platform",
        "gate",
        [
          node(
            "demo-default:anchor",
            "portal",
            "cube",
            "gate",
            "Baseline",
            "focused",
            [-7, 1, 0],
            [3, 3, 2],
            hover_cycle: true
          ),
          node(
            "demo-default:echo",
            "state",
            "socket",
            "eye",
            "Echo",
            "active",
            [1, 4, 0],
            [2, 2, 2]
          ),
          node(
            "demo-default:seal",
            "memory",
            "cube",
            "seal",
            "Seal",
            "complete",
            [7, 0, 1],
            [2, 2, 2]
          )
        ],
        [
          conduit(
            "demo-default:edge:1",
            "demo-default:anchor",
            "demo-default:echo",
            "command_stream",
            "visible",
            "square",
            0.44
          ),
          conduit(
            "demo-default:edge:2",
            "demo-default:echo",
            "demo-default:seal",
            "command_stream",
            "visible",
            "square",
            0.4
          )
        ],
        distance: 19
      )
    )
  end

  defp collapse_sample do
    sample(
      "collapse-observatory",
      %{
        eyebrow: "Mode / collapse",
        title: "Archival collapse",
        description:
          "A calmer Techtree-style loop that contracts inward, dims, flashes brass, then rebuilds without any extra group choreography.",
        note:
          "Use this when you want a research or review surface to feel deliberate instead of explosive.",
        theme: "techtree",
        theme_class: "rg-regent-theme-techtree",
        camera_distance: 20,
        settings: [
          {"mode", "collapse"},
          {"fill", "brass wash"},
          {"stroke", "brass edge"},
          {"opacity", "0.16"},
          {"scale", "0.68"},
          {"translate", "8"},
          {"shadow", "soft brass bloom"}
        ]
      },
      scene(
        "techtree",
        "seed",
        [
          node(
            "demo-collapse:archive",
            "portal",
            "monolith",
            "seed",
            "Archive",
            "focused",
            [-8, 1, 0],
            [3, 4, 2],
            hover_cycle: %{
              "mode" => "collapse",
              "durationMs" => 960,
              "fill" => "rgba(212, 177, 91, 0.3)",
              "stroke" => "#6f5314",
              "opacity" => 0.16,
              "scale" => 0.68,
              "translate" => 8,
              "shadow" => "drop-shadow(0 0 14px rgba(212, 177, 91, 0.42))"
            }
          ),
          node(
            "demo-collapse:review",
            "proof",
            "cube",
            "eye",
            "Review",
            "active",
            [0, 5, 0],
            [2, 2, 2]
          ),
          node(
            "demo-collapse:seal",
            "memory",
            "cube",
            "seal",
            "Seal",
            "complete",
            [7, 1, 2],
            [2, 2, 2]
          )
        ],
        [
          conduit(
            "demo-collapse:edge:1",
            "demo-collapse:archive",
            "demo-collapse:review",
            "dependency",
            "visible",
            "square",
            0.46
          ),
          conduit(
            "demo-collapse:edge:2",
            "demo-collapse:review",
            "demo-collapse:seal",
            "dependency",
            "visible",
            "square",
            0.42
          )
        ],
        distance: 20
      )
    )
  end

  defp explode_sample do
    hover_cycle = %{
      "group" => "demo-explode-cluster",
      "mode" => "explode",
      "durationMs" => 920,
      "fill" => "rgba(217, 119, 6, 0.3)",
      "stroke" => "#8f3d16",
      "opacity" => 0.18,
      "scale" => 1.08,
      "translate" => 14,
      "staggerMs" => 24,
      "shadow" => "drop-shadow(0 0 16px rgba(217, 119, 6, 0.36))"
    }

    sample(
      "explode-cluster",
      %{
        eyebrow: "Mode / explode + group",
        title: "Grouped launch cluster",
        description:
          "This is the hotter Autolaunch version. Hover one voxel and the entire launch cluster rips outward together, including the link between them.",
        note:
          "Use matching group keys when you want nodes and conduits to feel like one live launch system instead of separate pieces.",
        theme: "autolaunch",
        theme_class: "rg-regent-theme-autolaunch",
        camera_distance: 20,
        settings: [
          {"mode", "explode"},
          {"group", "demo-explode-cluster"},
          {"durationMs", "920"},
          {"staggerMs", "24"},
          {"scale", "1.08"},
          {"translate", "14"},
          {"shadow", "hot copper bloom"}
        ]
      },
      scene(
        "autolaunch",
        "fuse",
        [
          node(
            "demo-explode:crucible",
            "action",
            "monolith",
            "fuse",
            "Crucible",
            "focused",
            [-9, 1, 0],
            [3, 4, 2],
            hover_cycle: hover_cycle
          ),
          node(
            "demo-explode:market",
            "token",
            "reliquary",
            "gate",
            "Market",
            "active",
            [-1, 4, 0],
            [2, 2, 2],
            hover_cycle: hover_cycle
          ),
          node(
            "demo-explode:settlement",
            "state",
            "cube",
            "seal",
            "Settlement",
            "complete",
            [6, 0, 2],
            [2, 2, 2]
          )
        ],
        [
          conduit(
            "demo-explode:edge:1",
            "demo-explode:crucible",
            "demo-explode:market",
            "launch_phase",
            "flowing",
            "rounded",
            0.5,
            hover_cycle: Map.put(hover_cycle, "includeMarker", false)
          ),
          conduit(
            "demo-explode:edge:2",
            "demo-explode:market",
            "demo-explode:settlement",
            "launch_phase",
            "visible",
            "rounded",
            0.44
          )
        ],
        distance: 20
      )
    )
  end

  defp phase_sample do
    sample(
      "phase-operator",
      %{
        eyebrow: "Mode / phase",
        title: "Operator phase pass",
        description:
          "A quieter platform-style loop. The voxel phases upward, waits, and returns with a tighter timing curve instead of breaking apart dramatically.",
        note:
          "This works well in headers and status landmarks where you want motion, but you do not want the surface to feel frantic.",
        theme: "platform",
        theme_class: "rg-regent-theme-platform",
        camera_distance: 20,
        settings: [
          {"mode", "phase"},
          {"durationMs", "1080"},
          {"loopDelayMs", "180"},
          {"easing", "inOutQuad"},
          {"scale", "0.9"},
          {"translate", "10"},
          {"opacity", "0.28"}
        ]
      },
      scene(
        "platform",
        "gate",
        [
          node(
            "demo-phase:gate",
            "portal",
            "monolith",
            "gate",
            "Session gate",
            "focused",
            [-8, 1, 0],
            [3, 4, 2],
            hover_cycle: %{
              "mode" => "phase",
              "durationMs" => 1080,
              "loopDelayMs" => 180,
              "easing" => "inOutQuad",
              "fill" => "rgba(212, 167, 86, 0.24)",
              "stroke" => "#7a5e24",
              "opacity" => 0.28,
              "scale" => 0.9,
              "translate" => 10,
              "shadow" => "drop-shadow(0 0 14px rgba(212, 167, 86, 0.34))"
            }
          ),
          node(
            "demo-phase:eye",
            "state",
            "socket",
            "eye",
            "Inspect",
            "active",
            [0, 4, 0],
            [2, 2, 2]
          ),
          node(
            "demo-phase:guard",
            "state",
            "ghost",
            "wedge",
            "Guardrail",
            "available",
            [7, 0, 1],
            [2, 2, 2],
            opaque: false
          )
        ],
        [
          conduit(
            "demo-phase:edge:1",
            "demo-phase:gate",
            "demo-phase:eye",
            "command_stream",
            "visible",
            "square",
            0.45
          ),
          conduit(
            "demo-phase:edge:2",
            "demo-phase:eye",
            "demo-phase:guard",
            "command_stream",
            "sealed",
            "square",
            0.4
          )
        ],
        distance: 20
      )
    )
  end

  defp marker_only_sample do
    sample(
      "marker-only",
      %{
        eyebrow: "Split motion / marker only",
        title: "Sigil bloom only",
        description:
          "Only the sigil cycles here. The voxel mass stays still, which is useful when you want to accent the symbol without making the geometry itself feel unstable.",
        note:
          "Hover the carved cube. The glyph should breathe while the cube body stays anchored.",
        theme: "techtree",
        theme_class: "rg-regent-theme-techtree",
        camera_distance: 19,
        settings: [
          {"includeMarker", "true"},
          {"includePolygons", "false"},
          {"mode", "collapse"},
          {"loopDelayMs", "220"},
          {"shadow", "sigil-only glow"}
        ]
      },
      scene(
        "techtree",
        "eye",
        [
          node(
            "demo-marker:eye",
            "proof",
            "carved_cube",
            "eye",
            "Review sigil",
            "focused",
            [-5, 2, 0],
            [3, 3, 2],
            hover_cycle: %{
              "mode" => "collapse",
              "durationMs" => 860,
              "loopDelayMs" => 220,
              "opacity" => 0.18,
              "scale" => 0.78,
              "translate" => 7,
              "shadow" => "drop-shadow(0 0 14px rgba(80, 112, 188, 0.34))",
              "includeMarker" => true,
              "includePolygons" => false
            }
          ),
          node(
            "demo-marker:archive",
            "memory",
            "cube",
            "seal",
            "Archive",
            "complete",
            [4, 0, 1],
            [2, 2, 2]
          )
        ],
        [
          conduit(
            "demo-marker:edge:1",
            "demo-marker:eye",
            "demo-marker:archive",
            "dependency",
            "visible",
            "square",
            0.42
          )
        ],
        distance: 19
      )
    )
  end

  defp polygons_only_sample do
    sample(
      "polygons-only",
      %{
        eyebrow: "Split motion / polygons only",
        title: "Geometry burn",
        description:
          "This one does the opposite: the voxel mass tears apart and rebuilds, but the sigil stays fixed. It is useful when the symbol should stay readable while the body shows risk or heat.",
        note: "Hover the reliquary. The shell should deform while the sigil stays stable.",
        theme: "autolaunch",
        theme_class: "rg-regent-theme-autolaunch",
        camera_distance: 19,
        settings: [
          {"includeMarker", "false"},
          {"includePolygons", "true"},
          {"mode", "explode"},
          {"fill", "ember wash"},
          {"stroke", "rust edge"},
          {"opacity", "0.22"}
        ]
      },
      scene(
        "autolaunch",
        "wedge",
        [
          node(
            "demo-polygons:risk",
            "state",
            "reliquary",
            "wedge",
            "Risk shell",
            "focused",
            [-5, 2, 0],
            [3, 3, 2],
            hover_cycle: %{
              "mode" => "explode",
              "durationMs" => 900,
              "fill" => "rgba(187, 80, 32, 0.34)",
              "stroke" => "#8f3d16",
              "opacity" => 0.22,
              "scale" => 1.06,
              "translate" => 12,
              "shadow" => "drop-shadow(0 0 14px rgba(187, 80, 32, 0.28))",
              "includeMarker" => false,
              "includePolygons" => true
            }
          ),
          node(
            "demo-polygons:seal",
            "state",
            "ghost",
            "seal",
            "Settled",
            "available",
            [4, 0, 1],
            [2, 2, 2],
            opaque: false
          )
        ],
        [
          conduit(
            "demo-polygons:edge:1",
            "demo-polygons:risk",
            "demo-polygons:seal",
            "launch_phase",
            "visible",
            "rounded",
            0.42
          )
        ],
        distance: 19
      )
    )
  end

  defp sample(id, attrs, scene) do
    Map.merge(
      %{
        id: id,
        scene: scene,
        scene_version: scene["sceneVersion"] || 1,
        selected_node_id: first_node_id(scene)
      },
      attrs
    )
  end

  defp first_node_id(%{"faces" => [%{"nodes" => [%{"id" => id} | _]} | _]}) when is_binary(id),
    do: id

  defp first_node_id(_scene), do: nil

  defp scene(theme, sigil, nodes, conduits, opts) do
    %{
      "app" => theme,
      "theme" => theme,
      "activeFace" => "demo",
      "sceneVersion" => Keyword.get(opts, :scene_version, 1),
      "camera" => %{
        "type" => Keyword.get(opts, :camera_type, "oblique"),
        "angle" => Keyword.get(opts, :angle, 315),
        "distance" => Keyword.get(opts, :distance, 20)
      },
      "faces" => [
        %{
          "id" => "demo",
          "title" => "HoverCycle demo",
          "sigil" => sigil,
          "orientation" => "front",
          "nodes" => nodes,
          "conduits" => conduits
        }
      ]
    }
  end

  defp node(id, kind, geometry, sigil, label, status, position, size, opts \\ []) do
    base = %{
      "id" => id,
      "kind" => kind,
      "geometry" => geometry,
      "sigil" => sigil,
      "label" => label,
      "status" => status,
      "position" => position,
      "size" => size
    }

    base
    |> maybe_put("hoverCycle", Keyword.get(opts, :hover_cycle))
    |> maybe_put("opaque", Keyword.get(opts, :opaque))
    |> maybe_put("meta", Keyword.get(opts, :meta))
  end

  defp conduit(id, from, to, kind, state, shape, radius, opts \\ []) do
    %{
      "id" => id,
      "from" => from,
      "to" => to,
      "kind" => kind,
      "state" => state,
      "shape" => shape,
      "radius" => radius
    }
    |> maybe_put("hoverCycle", Keyword.get(opts, :hover_cycle))
    |> maybe_put("meta", Keyword.get(opts, :meta))
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
