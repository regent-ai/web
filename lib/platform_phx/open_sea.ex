defmodule PlatformPhx.OpenSea do
  @moduledoc false

  alias PlatformPhx.Ethereum
  alias PlatformPhx.RuntimeConfig

  @type collection :: :all | String.t()
  @type reason ::
          {:bad_request, String.t()}
          | {:unavailable, String.t()}
          | {:external, :opensea, String.t()}

  @collections ["animata", "regent-animata-ii", "animata-pass"]
  @redeem_collections %{"animata" => "animata", "regent-animata-ii" => "regent-animata-ii"}
  @max_token_count 1_000
  @page_limit 100
  @cache_table :platform_phx_opensea_cache
  @cache_ttl_ms :timer.minutes(1)

  @type accumulator :: %{ids: [integer()], count: non_neg_integer()}

  @spec fetch_holdings(term(), collection()) :: {:ok, map()} | {:error, reason()}
  def fetch_holdings(address, collection \\ :all) do
    with {:ok, normalized_address} <- normalize_address(address),
         {:ok, api_key} <- api_key(),
         {:ok, requested_collections} <- requested_collections(collection),
         {:ok, holdings_by_collection} <-
           fetch_requested_collections(normalized_address, requested_collections, api_key) do
      {:ok,
       %{
         "address" => normalized_address,
         "animata1" => Map.get(holdings_by_collection, "animata", []),
         "animata2" => Map.get(holdings_by_collection, "regent-animata-ii", []),
         "animataPass" => Map.get(holdings_by_collection, "animata-pass", [])
       }}
    end
  end

  @spec fetch_redeem_stats() :: {:ok, map()} | {:error, reason()}
  def fetch_redeem_stats do
    with {:miss, table} <- fetch_cached(:redeem_stats),
         {:ok, api_key} <- api_key(),
         {:ok, stats} <- fetch_collection_supplies(api_key) do
      put_cached(table, :redeem_stats, stats)
      {:ok, stats}
    else
      {:hit, stats} -> {:ok, stats}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec clear_cache() :: :ok
  def clear_cache do
    case :ets.whereis(@cache_table) do
      :undefined -> :ok
      table -> :ets.delete_all_objects(table)
    end

    :ok
  end

  defp normalize_address(address) do
    case Ethereum.normalize_address(address) do
      nil -> {:error, {:bad_request, "Invalid query params"}}
      normalized_address -> {:ok, normalized_address}
    end
  end

  defp api_key do
    case RuntimeConfig.opensea_api_key() do
      nil -> {:error, {:unavailable, "Server missing OPENSEA_API_KEY"}}
      api_key -> {:ok, api_key}
    end
  end

  defp requested_collections(:all), do: {:ok, @collections}
  defp requested_collections(nil), do: {:ok, @collections}

  defp requested_collections(collection) when is_binary(collection) do
    if collection in @collections do
      {:ok, [collection]}
    else
      {:error, {:bad_request, "Invalid query params"}}
    end
  end

  defp requested_collections(_collection), do: {:error, {:bad_request, "Invalid query params"}}

  defp fetch_collection_supplies(api_key) do
    @redeem_collections
    |> Task.async_stream(
      fn {key, slug} ->
        with {:ok, count} <- fetch_collection_supply(slug, api_key) do
          {:ok, {key, count}}
        end
      end,
      max_concurrency: 2,
      ordered: false,
      timeout: 15_000
    )
    |> Enum.reduce_while({:ok, %{}}, fn
      {:ok, {:ok, {key, count}}}, {:ok, acc} ->
        {:cont, {:ok, Map.put(acc, key, count)}}

      {:ok, {:error, reason}}, _acc ->
        {:halt, {:error, reason}}

      {:exit, reason}, _acc ->
        {:halt, {:error, {:external, :opensea, "OpenSea request failed: #{inspect(reason)}"}}}
    end)
  end

  defp fetch_requested_collections(address, requested_collections, api_key) do
    requested_collections
    |> Task.async_stream(
      fn collection ->
        with {:ok, token_ids} <- fetch_collection(address, collection, api_key) do
          {:ok, {collection, token_ids}}
        end
      end,
      max_concurrency: 3,
      ordered: false,
      timeout: 15_000
    )
    |> Enum.reduce_while({:ok, %{}}, fn
      {:ok, {:ok, {collection, token_ids}}}, {:ok, acc} ->
        {:cont, {:ok, Map.put(acc, collection, token_ids)}}

      {:ok, {:error, reason}}, _acc ->
        {:halt, {:error, reason}}

      {:exit, reason}, _acc ->
        {:halt, {:error, {:external, :opensea, "OpenSea request failed: #{inspect(reason)}"}}}
    end)
  end

  defp fetch_collection_supply(slug, api_key) do
    url = URI.new!("https://api.opensea.io/api/v2/collections/#{slug}")

    case http_client().get(url, headers: [{"accept", "application/json"}, {"x-api-key", api_key}]) do
      {:ok, %{status: status, body: %{"total_supply" => total_supply}}}
      when status in 200..299 and is_integer(total_supply) ->
        {:ok, total_supply}

      {:ok, %{status: status, body: %{"total_supply" => total_supply}}}
      when status in 200..299 and is_binary(total_supply) ->
        case Integer.parse(total_supply) do
          {parsed, ""} -> {:ok, parsed}
          _other -> {:error, {:external, :opensea, "OpenSea response invalid"}}
        end

      {:ok, %{status: status, body: body}} when status in 200..299 ->
        {:error, {:external, :opensea, "OpenSea response invalid: #{inspect(body)}"}}

      {:ok, %{status: status}} ->
        {:error, {:external, :opensea, "OpenSea request failed with status #{status}"}}

      {:error, error} ->
        {:error, {:external, :opensea, "OpenSea request failed: #{Exception.message(error)}"}}
    end
  end

  defp fetch_collection(address, collection, api_key) do
    do_fetch_collection(address, collection, api_key, nil, %{ids: [], count: 0})
  end

  defp do_fetch_collection(_address, _collection, _api_key, _cursor, %{ids: ids, count: count})
       when count >= @max_token_count do
    {:ok, ids |> Enum.sort() |> Enum.take(@max_token_count)}
  end

  defp do_fetch_collection(address, collection, api_key, cursor, acc) do
    url =
      URI.new!("https://api.opensea.io/api/v2/chain/base/account/#{address}/nfts")
      |> URI.append_query("collection=#{collection}&limit=#{@page_limit}")
      |> maybe_append_cursor(cursor)

    case http_client().get(url, headers: [{"accept", "application/json"}, {"x-api-key", api_key}]) do
      {:ok, %{status: status, body: body}} when status in 200..299 ->
        consume_page(address, collection, api_key, body, acc)

      {:ok, %{status: status}} ->
        {:error, {:external, :opensea, "OpenSea request failed with status #{status}"}}

      {:error, error} ->
        {:error, {:external, :opensea, "OpenSea request failed: #{Exception.message(error)}"}}
    end
  end

  defp consume_page(address, collection, api_key, %{"nfts" => nfts, "next" => next_cursor}, acc)
       when is_list(nfts) do
    remaining = @max_token_count - acc.count

    token_ids =
      nfts
      |> Enum.filter(fn nft ->
        is_nil(nft["collection"]) or String.downcase(nft["collection"]) == collection
      end)
      |> Enum.map(&parse_identifier/1)
      |> Enum.reject(&is_nil/1)
      |> Enum.take(remaining)

    next_acc = %{
      ids: Enum.reduce(token_ids, acc.ids, fn token_id, ids -> [token_id | ids] end),
      count: acc.count + length(token_ids)
    }

    if is_binary(next_cursor) and next_cursor != "" and next_acc.count < @max_token_count do
      do_fetch_collection(address, collection, api_key, next_cursor, next_acc)
    else
      {:ok, next_acc.ids |> Enum.sort() |> Enum.take(@max_token_count)}
    end
  end

  defp consume_page(_address, _collection, _api_key, _body, _acc) do
    {:error, {:external, :opensea, "OpenSea response invalid"}}
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

  defp fetch_cached(key) do
    table = ensure_cache_table()
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(table, key) do
      [{^key, expires_at, value}] when expires_at > now -> {:hit, value}
      _stale_or_missing -> {:miss, table}
    end
  end

  defp put_cached(table, key, value) do
    expires_at = System.monotonic_time(:millisecond) + @cache_ttl_ms
    true = :ets.insert(table, {key, expires_at, value})
    :ok
  end

  defp ensure_cache_table do
    case :ets.whereis(@cache_table) do
      :undefined ->
        :ets.new(@cache_table, [:named_table, :public, read_concurrency: true])

      table ->
        table
    end
  end

  defp http_client do
    Application.get_env(:platform_phx, :opensea_http_client, PlatformPhx.OpenSea.ReqClient)
  end
end
