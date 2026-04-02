defmodule PlatformPhx.DatabaseUrl do
  @moduledoc false

  @sslmode_secure_values ~w(require verify-ca verify-full)

  def ssl_enabled?(database_url, override \\ System.get_env("ECTO_SSL")) do
    case normalize_override(override) do
      :enabled -> true
      :disabled -> false
      :unset -> ssl_enabled_from_url?(database_url)
    end
  end

  defp normalize_override(value) when is_binary(value) do
    case String.trim(value) |> String.downcase() do
      value when value in ~w(1 true yes on require) -> :enabled
      value when value in ~w(0 false no off disable disabled) -> :disabled
      "" -> :unset
      _ -> :unset
    end
  end

  defp normalize_override(_value), do: :unset

  defp ssl_enabled_from_url?(database_url) when is_binary(database_url) do
    case URI.parse(database_url) do
      %URI{query: nil} ->
        false

      %URI{query: query} ->
        params = URI.decode_query(query)
        truthy?(params["ssl"]) or secure_sslmode?(params["sslmode"])
    end
  end

  defp ssl_enabled_from_url?(_database_url), do: false

  defp truthy?(value) when is_binary(value),
    do: (String.trim(value) |> String.downcase()) in ~w(1 true yes on)

  defp truthy?(_value), do: false

  defp secure_sslmode?(value) when is_binary(value),
    do: (String.trim(value) |> String.downcase()) in @sslmode_secure_values

  defp secure_sslmode?(_value), do: false
end
