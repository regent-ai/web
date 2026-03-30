defmodule PlatformPhxWeb.Api.BasenamesController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Basenames

  def config(conn, _params) do
    json(conn, Basenames.config_payload())
  end

  def allowance(conn, %{"address" => address}) do
    json(conn, Basenames.allowance_payload(address))
  rescue
    error in ArgumentError ->
      conn |> put_status(:bad_request) |> json(%{"statusMessage" => Exception.message(error)})
  end

  def allowance(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid address"})
  end

  def availability(conn, %{"label" => label}) do
    json(conn, Basenames.availability_payload(label))
  rescue
    error in ArgumentError ->
      conn |> put_status(:bad_request) |> json(%{"statusMessage" => Exception.message(error)})
  end

  def availability(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid label"})
  end

  def owned(conn, %{"address" => address}) do
    json(conn, Basenames.owned_payload(address))
  rescue
    error in ArgumentError ->
      conn |> put_status(:bad_request) |> json(%{"statusMessage" => Exception.message(error)})
  end

  def owned(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid address"})
  end

  def recent(conn, params) do
    limit =
      case params["limit"] do
        nil -> 12
        value -> String.to_integer(value)
      end

    json(conn, Basenames.recent_payload(limit))
  rescue
    _error -> conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid limit"})
  end

  def mint(conn, params) do
    json(conn, Basenames.mint!(params))
  rescue
    error in ArgumentError ->
      conn |> put_status(:bad_request) |> json(%{"statusMessage" => Exception.message(error)})
  end
end
