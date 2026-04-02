defmodule Regent.Surface do
  @moduledoc false
  defdelegate surface(assigns), to: Regent.Components
end
