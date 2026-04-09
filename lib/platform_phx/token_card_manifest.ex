defmodule PlatformPhx.TokenCardManifest do
  @moduledoc false

  require Logger

  @spec fetch(integer() | String.t()) :: {:ok, map()} | {:error, :not_found | :invalid_token_id}
  def fetch(token_id)

  def fetch(token_id) when is_integer(token_id) and token_id > 0 do
    Logger.info("token_card_manifest fetch token_id=#{token_id}")

    with {:ok, items} <- load_items(),
         %{} = entry <- Enum.find(items, &(&1["tokenId"] == token_id)) do
      Logger.info("token_card_manifest hit token_id=#{token_id}")
      {:ok, entry}
    else
      nil ->
        Logger.warning("token_card_manifest missing token_id=#{token_id}")
        {:error, :not_found}

      {:error, reason} = error ->
        Logger.error(
          "token_card_manifest load_failed token_id=#{token_id} reason=#{inspect(reason)}"
        )

        error
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
    path = manifest_path()

    Logger.info("token_card_manifest load path=#{path}")

    with {:ok, body} <- File.read(path),
         {:ok, %{"items" => items}} when is_list(items) <- Jason.decode(body) do
      Logger.info("token_card_manifest loaded path=#{path} items=#{length(items)}")
      {:ok, items}
    else
      {:error, reason} ->
        {:error, {:read_failed, path, reason}}

      {:ok, decoded} ->
        {:error, {:unexpected_json_shape, path, decoded}}

      decode_error ->
        {:error, {:decode_failed, path, decode_error}}
    end
  end

  defp manifest_path do
    Application.app_dir(:platform_phx, "priv/static/animata/token-card-manifest.json")
  end
end
