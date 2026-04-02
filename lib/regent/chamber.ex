defmodule Regent.Chamber do
  @moduledoc false
  defdelegate chamber(assigns), to: Regent.Panels
end
