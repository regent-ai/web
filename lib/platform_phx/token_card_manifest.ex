defmodule PlatformPhx.TokenCardManifest do
  @moduledoc false

  @manifest_path Application.app_dir(
                   :platform_phx,
                   "priv/static/animata/token-card-manifest.json"
                 )

  @spec fetch(integer() | String.t()) :: {:ok, map()} | {:error, :not_found | :invalid_token_id}
  def fetch(token_id)

  def fetch(token_id) when is_integer(token_id) and token_id > 0 do
    with {:ok, items} <- load_items(),
         %{} = entry <- Enum.find(items, &(&1["tokenId"] == token_id)) do
      {:ok, entry}
    else
      nil -> {:error, :not_found}
      {:error, _reason} = error -> error
    end
  end

  def fetch(token_id) when is_binary(token_id) do
    case Integer.parse(token_id) do
      {parsed, ""} when parsed > 0 -> fetch(parsed)
      _other -> {:error, :invalid_token_id}
    end
  end

  def fetch(_token_id), do: {:error, :invalid_token_id}

  defp load_items do
    with {:ok, body} <- File.read(@manifest_path),
         {:ok, %{"items" => items}} when is_list(items) <- Jason.decode(body) do
      {:ok, items}
    else
      _error -> {:error, :not_found}
    end
  end
end
