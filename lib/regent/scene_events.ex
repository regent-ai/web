defmodule Regent.SceneEvents do
  @moduledoc """
  Centralizes LiveView <-> hook event names and push helpers for Regent surfaces.
  """

  import Phoenix.LiveView, only: [push_event: 3]

  @scene_replace "regent:scene_replace"
  @scene_patch "regent:scene_patch"
  @scene_focus "regent:scene_focus"
  @scene_pulse "regent:scene_pulse"
  @scene_ghost "regent:scene_ghost"

  def scene_replace_event, do: @scene_replace
  def scene_patch_event, do: @scene_patch
  def scene_focus_event, do: @scene_focus
  def scene_pulse_event, do: @scene_pulse
  def scene_ghost_event, do: @scene_ghost

  def push_scene_replace(socket, scene), do: push_event(socket, @scene_replace, %{scene: scene})

  def push_scene_patch(socket, attrs) when is_map(attrs),
    do: push_event(socket, @scene_patch, attrs)

  def push_scene_focus(socket, target_id),
    do: push_event(socket, @scene_focus, %{target_id: target_id})

  def push_scene_pulse(socket, target_id, state),
    do: push_event(socket, @scene_pulse, %{target_id: target_id, state: state})

  def push_scene_ghost(socket, target_id, diff),
    do: push_event(socket, @scene_ghost, %{target_id: target_id, diff: diff})
end
