defmodule Regent do
  @moduledoc """
  Imports the canonical Regent function components into the caller.
  """

  defmacro __using__(_opts) do
    quote do
      import Regent.Components, only: [surface: 1]
      import Regent.Panels, only: [chamber: 1, ledger: 1]
    end
  end
end
