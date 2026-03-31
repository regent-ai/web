defmodule PlatformPhx.RuntimeConfig do
  @moduledoc false

  def database_url, do: fetch("DATABASE_URL")
  def base_rpc_url, do: fetch("BASE_RPC_URL")
  def ethereum_rpc_url, do: fetch("ETHEREUM_RPC_URL")
  def privy_app_id, do: fetch("VITE_PRIVY_APP_ID")
  def privy_client_id, do: fetch("VITE_PRIVY_APP_CLIENT_ID")
  def redeemer_address, do: fetch("VITE_NEXT_PUBLIC_REDEEMER_ADDRESS")
  def opensea_api_key, do: fetch("OPENSEA_API_KEY")
  def basename_parent_name, do: fetch("AGENT_BASENAME_PARENT_NAME") || "agent.base.eth"
  def ens_parent_name, do: fetch("AGENT_PROTOCOL_ENS_PARENT_NAME") || "regent.eth"

  def basenames_registry_address,
    do: fetch("BASENAMES_REGISTRY_ADDRESS") || "0xb94704422c2a1e396835a571837aa5ae53285a95"

  def basenames_l2_resolver_address,
    do: fetch("BASENAMES_L2_RESOLVER_ADDRESS") || "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD"

  def ens_registry_address,
    do: fetch("ENS_REGISTRY_ADDRESS") || "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"

  def ens_public_resolver_address,
    do: fetch("ENS_PUBLIC_RESOLVER_ADDRESS") || "0x226159d592E2b063810a10Ebf6dcbAda94Ed68b8"

  def basenames_payment_recipient, do: fetch("AGENT_BASENAME_PAYMENT_RECIPIENT")
  def basenames_price_wei, do: fetch("AGENT_BASENAME_PRICE_WEI") || "2500000000000000"

  defp fetch(name) do
    System.get_env(name)
    |> case do
      nil ->
        nil

      value ->
        trimmed = String.trim(value)
        if trimmed == "", do: nil, else: trimmed
    end
  end
end
