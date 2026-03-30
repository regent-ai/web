defmodule PlatformPhxWeb.Api.OpenseaController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Ethereum
  alias PlatformPhx.RuntimeConfig

  @collections ["animata", "regent-animata-ii", "animata-pass"]

  def index(conn, %{"address" => address} = params) do
    normalized = Ethereum.normalize_address(address)

    if is_nil(normalized) do
      conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid query params"})
    else
      case RuntimeConfig.opensea_api_key() do
        nil ->
          conn
          |> put_status(:internal_server_error)
          |> json(%{"statusMessage" => "Server missing OPENSEA_API_KEY"})

        api_key ->
          collection = params["collection"]

          if not is_nil(collection) and collection not in @collections do
            conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid query params"})
          else
            requested = if is_nil(collection), do: @collections, else: [collection]

            results =
              Enum.reduce(requested, %{}, fn slug, acc ->
                Map.put(acc, slug, fetch_collection!(normalized, slug, api_key))
              end)

            json(conn, %{
              "address" => normalized,
              "animata1" => Map.get(results, "animata", []),
              "animata2" => Map.get(results, "regent-animata-ii", []),
              "animataPass" => Map.get(results, "animata-pass", [])
            })
          end
      end
    end
  end

  def index(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid query params"})
  end

  defp fetch_collection!(address, slug, api_key) do
    stream_collection(address, slug, api_key, nil, [])
  end

  defp stream_collection(_address, _slug, _api_key, _cursor, acc) when length(acc) >= 1_000,
    do: Enum.sort(acc)

  defp stream_collection(address, slug, api_key, cursor, acc) do
    url =
      URI.new!("https://api.opensea.io/api/v2/chain/base/account/#{address}/nfts")
      |> URI.append_query("collection=#{slug}&limit=100")
      |> maybe_append_cursor(cursor)

    response =
      Req.get!(url,
        headers: [
          {"accept", "application/json"},
          {"x-api-key", api_key}
        ]
      )

    case response.body do
      %{"nfts" => nfts, "next" => next_cursor} ->
        token_ids =
          nfts
          |> Enum.filter(fn nft ->
            is_nil(nft["collection"]) or String.downcase(nft["collection"]) == slug
          end)
          |> Enum.map(&parse_identifier/1)
          |> Enum.reject(&is_nil/1)

        merged = acc ++ token_ids

        if is_binary(next_cursor) and next_cursor != "" do
          stream_collection(address, slug, api_key, next_cursor, merged)
        else
          Enum.sort(merged)
        end

      _ ->
        raise ArgumentError, "OpenSea response invalid"
    end
  end

  defp maybe_append_cursor(uri, nil), do: uri

  defp maybe_append_cursor(uri, cursor),
    do: URI.append_query(uri, "next=#{URI.encode_www_form(cursor)}")

  defp parse_identifier(%{"identifier" => value}) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> parsed
      _ -> nil
    end
  end

  defp parse_identifier(_value), do: nil
end
