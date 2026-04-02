defmodule PlatformPhx.OpenSea.HttpClient do
  @moduledoc false

  @callback get(URI.t() | String.t(), keyword()) ::
              {:ok, %{status: integer(), body: map()}} | {:error, term()}
end
