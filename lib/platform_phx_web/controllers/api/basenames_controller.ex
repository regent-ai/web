defmodule PlatformPhxWeb.Api.BasenamesController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Basenames
  alias PlatformPhx.HttpError

  def config(conn, _params) do
    json(conn, Basenames.config_payload())
  end

  def allowances(conn, _params) do
    json(conn, Basenames.allowances_payload())
  rescue
    error in HttpError -> http_error(conn, error)
  end

  def allowance(conn, %{"address" => address}) do
    json(conn, Basenames.allowance_payload(address))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  def allowance(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid address"})
  end

  def availability(conn, %{"label" => label}) do
    json(conn, Basenames.availability_payload(label))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  def availability(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid label"})
  end

  def owned(conn, %{"address" => address}) do
    json(conn, Basenames.owned_payload(address))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
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
    error in HttpError -> http_error(conn, error)
    _error -> conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid limit"})
  end

  def credits(conn, %{"address" => address}) do
    json(conn, Basenames.credits_payload(address))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  def credits(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => "Invalid address"})
  end

  def credit(conn, params) do
    json(conn, Basenames.credit!(params))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  def use(conn, params) do
    json(conn, Basenames.use!(params))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  def mint(conn, params) do
    json(conn, Basenames.mint!(params))
  rescue
    error in HttpError -> http_error(conn, error)
    error in ArgumentError -> bad_request(conn, error)
  end

  defp bad_request(conn, error) do
    conn |> put_status(:bad_request) |> json(%{"statusMessage" => Exception.message(error)})
  end

  defp http_error(conn, %HttpError{status: status, message: message}) do
    conn |> put_status(status) |> json(%{"statusMessage" => message})
  end
end
