defmodule PlatformPhx.Accounts do
  @moduledoc false

  alias PlatformPhx.Accounts.HumanUser
  alias PlatformPhx.Repo

  def get_human(nil), do: nil
  def get_human(id) when is_integer(id), do: Repo.get(HumanUser, id)

  def get_human_by_privy_id(nil), do: nil

  def get_human_by_privy_id(privy_user_id) when is_binary(privy_user_id) do
    Repo.get_by(HumanUser, privy_user_id: String.trim(privy_user_id))
  end

  def upsert_human_by_privy_id(privy_user_id, attrs)
      when is_binary(privy_user_id) and is_map(attrs) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    normalized_attrs =
      attrs
      |> normalize_human_attrs()
      |> Map.put("privy_user_id", String.trim(privy_user_id))

    Repo.insert(
      HumanUser.changeset(%HumanUser{}, normalized_attrs),
      conflict_target: :privy_user_id,
      on_conflict: [set: upsert_fields(normalized_attrs, now)],
      returning: true
    )
  end

  defp upsert_fields(attrs, now) do
    attrs
    |> Enum.reduce([updated_at: now], fn {key, value}, acc ->
      case {normalize_attr_key(key), value} do
        {"wallet_address", value} -> [{:wallet_address, value} | acc]
        {"wallet_addresses", value} -> [{:wallet_addresses, value} | acc]
        {"display_name", value} -> [{:display_name, value} | acc]
        _ -> acc
      end
    end)
    |> Enum.reverse()
  end

  defp normalize_human_attrs(attrs) do
    Enum.reduce(attrs, %{}, fn {key, value}, acc ->
      case normalize_attr_key(key) do
        "wallet_address" -> Map.put(acc, "wallet_address", normalize_address(value))
        "wallet_addresses" -> Map.put(acc, "wallet_addresses", normalize_addresses(value))
        "display_name" -> Map.put(acc, "display_name", normalize_text(value, 80))
        "stripe_llm_billing_status" -> Map.put(acc, "stripe_llm_billing_status", value)
        "stripe_llm_external_ref" -> Map.put(acc, "stripe_llm_external_ref", value)
        "privy_user_id" -> Map.put(acc, "privy_user_id", value)
        _ -> acc
      end
    end)
  end

  defp normalize_attr_key(key) when is_atom(key), do: Atom.to_string(key)
  defp normalize_attr_key(key) when is_binary(key), do: key
  defp normalize_attr_key(_key), do: nil

  defp normalize_address(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.downcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_address(_value), do: nil

  defp normalize_addresses(values) when is_list(values) do
    values
    |> Enum.map(&normalize_address/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp normalize_addresses(_values), do: []

  defp normalize_text(value, max_length) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      trimmed -> String.slice(trimmed, 0, max_length)
    end
  end

  defp normalize_text(_value, _max_length), do: nil
end
