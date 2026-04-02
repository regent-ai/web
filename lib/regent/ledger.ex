defmodule Regent.Ledger do
  @moduledoc false
  defdelegate ledger(assigns), to: Regent.Panels
end
