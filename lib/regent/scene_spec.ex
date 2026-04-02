defmodule Regent.SceneSpec do
  @moduledoc false

  def scene(app, theme, active_face, face, opts \\ []) do
    %{
      "app" => app,
      "theme" => theme,
      "activeFace" => active_face,
      "sceneVersion" => Keyword.get(opts, :scene_version, 1),
      "camera" => %{
        "type" => "oblique",
        "angle" => 315,
        "distance" => Keyword.get(opts, :distance, 24)
      },
      "faces" => [face]
    }
    |> maybe_put("cameraPresets", Keyword.get(opts, :camera_presets))
    |> maybe_put("activeCameraPreset", Keyword.get(opts, :active_camera_preset))
    |> maybe_put("cameraTargetId", Keyword.get(opts, :camera_target_id))
    |> maybe_put("meta", Keyword.get(opts, :meta))
  end

  def face(id, title, sigil, commands, markers, opts \\ []) do
    %{
      "id" => id,
      "title" => title,
      "sigil" => sigil,
      "orientation" => Keyword.get(opts, :orientation, "front"),
      "landmarkTargetId" => Keyword.get(opts, :landmark_target_id),
      "commands" => commands,
      "markers" => markers
    }
    |> maybe_put("meta", Keyword.get(opts, :meta))
  end

  def add_box(id, position, size, opts \\ []) do
    command("box", "add", id, Keyword.merge([position: position, size: size], opts))
  end

  def remove_box(id, position, size, opts \\ []) do
    command("box", "remove", id, Keyword.merge([position: position, size: size], opts))
  end

  def style_box(id, position, size, style) do
    command("box", "style", id, position: position, size: size, style: style)
  end

  def add_sphere(id, center, radius, opts \\ []) do
    command("sphere", "add", id, Keyword.merge([center: center, radius: radius], opts))
  end

  def remove_sphere(id, center, radius, opts \\ []) do
    command("sphere", "remove", id, Keyword.merge([center: center, radius: radius], opts))
  end

  def style_sphere(id, center, radius, style) do
    command("sphere", "style", id, center: center, radius: radius, style: style)
  end

  def add_line(id, from, to, opts \\ []) do
    command("line", "add", id, Keyword.merge([from: from, to: to], opts))
  end

  def remove_line(id, from, to, opts \\ []) do
    command("line", "remove", id, Keyword.merge([from: from, to: to], opts))
  end

  def style_line(id, from, to, style, opts \\ []) do
    command("line", "style", id, Keyword.merge([from: from, to: to, style: style], opts))
  end

  def add_fill(id, bounds, opts \\ []) do
    command("fill", "add", id, Keyword.merge([bounds: bounds], opts))
  end

  def remove_fill(id, bounds, opts \\ []) do
    command("fill", "remove", id, Keyword.merge([bounds: bounds], opts))
  end

  def style_fill(id, bounds, style, opts \\ []) do
    command("fill", "style", id, Keyword.merge([bounds: bounds, style: style], opts))
  end

  def marker(id, opts \\ []) do
    %{
      "id" => id,
      "label" => Keyword.get(opts, :label),
      "actionLabel" => Keyword.get(opts, :action_label),
      "sigil" => Keyword.get(opts, :sigil),
      "kind" => Keyword.get(opts, :kind),
      "status" => Keyword.get(opts, :status),
      "intent" => Keyword.get(opts, :intent),
      "backTargetId" => Keyword.get(opts, :back_target_id),
      "historyKey" => Keyword.get(opts, :history_key),
      "groupRole" => Keyword.get(opts, :group_role),
      "clickTone" => Keyword.get(opts, :click_tone),
      "meta" => Keyword.get(opts, :meta, %{}),
      "position" => Keyword.get(opts, :position),
      "commandId" => Keyword.get(opts, :command_id),
      "color" => Keyword.get(opts, :color),
      "contentSvg" => Keyword.get(opts, :content_svg)
    }
    |> reject_nil()
  end

  def node_style("active"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill-active, rgba(110, 189, 255, 0.78))",
        "stroke" => "var(--rg-node-stroke-active, #a7d8ff)"
      }
    }

  def node_style("focused"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill-focused, rgba(147, 114, 255, 0.8))",
        "stroke" => "var(--rg-node-stroke-focused, #d3c1ff)"
      }
    }

  def node_style("locked"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill-locked, rgba(92, 100, 121, 0.75))",
        "stroke" => "var(--rg-node-stroke-locked, #98a1b6)"
      }
    }

  def node_style("invalid"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill-invalid, rgba(255, 96, 133, 0.56))",
        "stroke" => "var(--rg-node-stroke-invalid, #ffb0c3)"
      }
    }

  def node_style("complete"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill-complete, rgba(130, 255, 196, 0.5))",
        "stroke" => "var(--rg-node-stroke-complete, #d2ffe8)"
      }
    }

  def node_style("ghosted"),
    do: %{
      "default" => %{
        "fill" => "none",
        "stroke" => "var(--rg-node-stroke-ghost, #7a88a8)",
        "opacity" => 0.5,
        "strokeDasharray" => "3 2"
      }
    }

  def node_style(_),
    do: %{
      "default" => %{
        "fill" => "var(--rg-node-fill, rgba(214, 224, 255, 0.52))",
        "stroke" => "var(--rg-node-stroke, #ced8f6)",
        "opacity" => 0.9
      }
    }

  def carved_wall_style(status) do
    base =
      case status do
        "active" -> {"rgba(8, 28, 46, 0.84)", "#a7d8ff"}
        "focused" -> {"rgba(20, 11, 42, 0.88)", "#d3c1ff"}
        "complete" -> {"rgba(6, 27, 20, 0.86)", "#d2ffe8"}
        "invalid" -> {"rgba(48, 8, 18, 0.86)", "#ffb0c3"}
        _ -> {"rgba(14, 21, 36, 0.82)", "#ced8f6"}
      end

    {fill, stroke} = base
    %{"default" => %{"fill" => fill, "stroke" => stroke, "opacity" => 0.82}}
  end

  def ghost_style do
    %{
      "default" => %{
        "fill" => "none",
        "stroke" => "var(--rg-node-stroke-ghost, #7a88a8)",
        "opacity" => 0.6,
        "strokeDasharray" => "3 2"
      }
    }
  end

  def conduit_style("flowing"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-conduit-fill-flowing, rgba(123, 224, 255, 0.62))",
        "stroke" => "var(--rg-conduit-stroke-flowing, #b2f0ff)"
      }
    }

  def conduit_style("blocked"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-conduit-fill-blocked, rgba(255, 120, 120, 0.65))",
        "stroke" => "var(--rg-conduit-stroke-blocked, #ffc1c1)"
      }
    }

  def conduit_style("sealed"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-conduit-fill-sealed, rgba(158, 255, 188, 0.55))",
        "stroke" => "var(--rg-conduit-stroke-sealed, #ceffde)"
      }
    }

  def conduit_style("fractured"),
    do: %{
      "default" => %{
        "fill" => "var(--rg-conduit-fill-fractured, rgba(255, 173, 104, 0.65))",
        "stroke" => "var(--rg-conduit-stroke-fractured, #ffd8b0)",
        "strokeDasharray" => "2 2"
      }
    }

  def conduit_style(_),
    do: %{
      "default" => %{
        "fill" => "var(--rg-conduit-fill, rgba(171, 183, 211, 0.24))",
        "stroke" => "var(--rg-conduit-stroke, #9eabc8)",
        "opacity" => 0.72
      }
    }

  def intent_style(style, intent)

  def intent_style(style, intent) when intent in [nil, "status_only"],
    do: style

  def intent_style(style, "scene_action"),
    do:
      merge_style(style, %{
        "default" => %{
          "stroke" => "var(--rg-intent-stroke-scene-action, #d8a24c)",
          "strokeWidth" => 0.8
        }
      })

  def intent_style(style, "navigate"),
    do:
      merge_style(style, %{
        "default" => %{
          "stroke" => "var(--rg-intent-stroke-navigate, #79c5ff)",
          "strokeWidth" => 0.8
        }
      })

  def intent_style(style, "back"),
    do:
      merge_style(style, %{
        "default" => %{
          "stroke" => "var(--rg-intent-stroke-back, #9fb8e6)",
          "strokeWidth" => 0.8,
          "strokeDasharray" => "3 2"
        }
      })

  def intent_style(style, "danger"),
    do:
      merge_style(style, %{
        "default" => %{
          "stroke" => "var(--rg-intent-stroke-danger, #ff8e8e)",
          "strokeWidth" => 0.9
        }
      })

  def intent_style(style, _intent), do: style

  def sphere_center(position, size) do
    [x, y, z] = position
    [w, h, d] = size
    [x + w / 2, y + h / 2, z + d / 2]
  end

  def sphere_radius([w, h, d]), do: Enum.max([w, h, d]) / 2

  def anchor(position, size), do: center_from_box(position, size)

  def center_from_box([x, y, z], [w, h, d]) do
    [x + div(max(w - 1, 0), 2), y + div(max(h - 1, 0), 2), z + max(d - 1, 0)]
  end

  def center_from_box(position, size) when is_number(size),
    do: center_from_box(position, [size, size, size])

  def inset_position([x, y, z]), do: [x + 1, y + 1, z]

  def inset_size([w, h, d]), do: [max(w - 2, 1), max(h - 2, 1), max(d - 1, 1)]

  def default_scale(node, status) do
    cond do
      is_list(node["scale"]) -> node["scale"]
      status in ["focused", "active"] -> [0.94, 0.94, 0.94]
      true -> nil
    end
  end

  def default_scale_origin(node, status) do
    cond do
      is_list(node["scaleOrigin"]) -> node["scaleOrigin"]
      status in ["focused", "active"] -> [0.5, 1, 0.5]
      true -> nil
    end
  end

  def socket_scale(size, status) do
    if Enum.max(size) > 2 or status in ["focused", "active"], do: [1, 0.88, 1], else: nil
  end

  defp command(primitive, op, id, opts) do
    %{
      "id" => id,
      "primitive" => primitive,
      "op" => op,
      "mode" => Keyword.get(opts, :mode),
      "style" => Keyword.get(opts, :style),
      "content" => Keyword.get(opts, :content),
      "opaque" => Keyword.get(opts, :opaque),
      "meta" => Keyword.get(opts, :meta),
      "rotate" => Keyword.get(opts, :rotate),
      "scale" => Keyword.get(opts, :scale),
      "scaleOrigin" => Keyword.get(opts, :scale_origin),
      "hoverCycle" => Keyword.get(opts, :hover_cycle),
      "targetId" => Keyword.get(opts, :target_id),
      "position" => Keyword.get(opts, :position),
      "size" => Keyword.get(opts, :size),
      "center" => Keyword.get(opts, :center),
      "radius" => Keyword.get(opts, :radius),
      "from" => Keyword.get(opts, :from),
      "to" => Keyword.get(opts, :to),
      "shape" => Keyword.get(opts, :shape),
      "bounds" => Keyword.get(opts, :bounds),
      "test" => Keyword.get(opts, :test)
    }
    |> reject_nil()
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp merge_style(nil, overlay), do: overlay

  defp merge_style(style, overlay) do
    Map.merge(style, overlay, fn _face, base, extra ->
      Map.merge(base, extra)
    end)
  end

  defp reject_nil(map) do
    Map.reject(map, fn {_key, value} -> is_nil(value) end)
  end
end
