defmodule PlatformPhxWeb.Api.BasenamesController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Basenames
  alias PlatformPhxWeb.ApiErrors

  def config(conn, _params) do
    ApiErrors.respond(conn, Basenames.config_payload())
  end

  def allowances(conn, _params) do
    ApiErrors.respond(conn, Basenames.allowances_payload())
  end

  def allowance(conn, %{"address" => address}) do
    ApiErrors.respond(conn, Basenames.allowance_payload(address))
  end

  def allowance(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid address"})
  end

  def availability(conn, %{"label" => label}) do
    ApiErrors.respond(conn, Basenames.availability_payload(label))
  end

  def availability(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid label"})
  end

  def owned(conn, %{"address" => address}) do
    ApiErrors.respond(conn, Basenames.owned_payload(address))
  end

  def owned(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid address"})
  end

  def recent(conn, params) do
    case parse_limit(params["limit"]) do
      {:ok, limit} -> ApiErrors.respond(conn, Basenames.recent_payload(limit))
      {:error, message} -> ApiErrors.error(conn, {:bad_request, message})
    end
  end

  def credits(conn, %{"address" => address}) do
    ApiErrors.respond(conn, Basenames.credits_payload(address))
  end

  def credits(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid address"})
  end

  def credit(conn, params) do
    ApiErrors.respond(conn, Basenames.register_credit(params))
  end

  def use(conn, params) do
    ApiErrors.respond(conn, Basenames.mark_in_use(params))
  end

  def mint(conn, params) do
    ApiErrors.respond(conn, Basenames.mint_name(params))
  end

  defp parse_limit(nil), do: {:ok, 12}

  defp parse_limit(value) when is_binary(value) do
    {:ok, String.to_integer(value)}
  rescue
    ArgumentError -> {:error, "Invalid limit"}
  end

  defp parse_limit(_value), do: {:error, "Invalid limit"}
end
