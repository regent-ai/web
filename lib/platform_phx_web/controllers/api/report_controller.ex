defmodule PlatformPhxWeb.Api.ReportController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.OperatorReports
  alias PlatformPhxWeb.ApiErrors

  def bug(conn, params) do
    ApiErrors.respond(conn, OperatorReports.create_bug_report_payload(params))
  end

  def security(conn, params) do
    ApiErrors.respond(conn, OperatorReports.create_security_report_payload(params))
  end
end
