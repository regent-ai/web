defmodule PlatformPhx.OpenSeaFakeClient do
  @moduledoc false
  @behaviour PlatformPhx.OpenSea.HttpClient

  @impl true
  def get(url, _options) do
    responses = Application.get_env(:platform_phx, :opensea_fake_responses, %{})

    case Map.fetch(responses, to_string(url)) do
      {:ok, {:ok, body}} -> {:ok, %{status: 200, body: body}}
      {:ok, {:status, status, body}} -> {:ok, %{status: status, body: body}}
      {:ok, {:error, reason}} -> {:error, RuntimeError.exception(format_reason(reason))}
      :error -> {:error, RuntimeError.exception("missing fake response for #{url}")}
    end
  end

  defp format_reason(reason) when is_binary(reason), do: reason
  defp format_reason(reason), do: inspect(reason)
end
