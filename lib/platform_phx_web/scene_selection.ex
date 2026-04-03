defmodule PlatformPhxWeb.SceneSelection do
  @moduledoc false

  @spec selected_target_id(map()) :: String.t() | nil
  def selected_target_id(%{
        "faces" => [%{"markers" => [%{"id" => id} | _marker_rest]} | _face_rest]
      })
      when is_binary(id),
      do: id

  def selected_target_id(_scene), do: nil
end
