defmodule PlatformPhx.DatabaseUrlTest do
  use ExUnit.Case, async: true

  alias PlatformPhx.DatabaseUrl

  test "enables ssl when the database url requests sslmode=require" do
    assert DatabaseUrl.ssl_enabled?(
             "postgresql://user:pass@example.com/neondb?sslmode=require",
             nil
           )
  end

  test "enables ssl when the database url requests ssl=true" do
    assert DatabaseUrl.ssl_enabled?(
             "postgresql://user:pass@example.com/neondb?ssl=true",
             nil
           )
  end

  test "does not enable ssl for plain urls without ssl flags" do
    refute DatabaseUrl.ssl_enabled?("postgresql://user:pass@example.com/local_db", nil)
  end

  test "allows env override to force ssl on" do
    assert DatabaseUrl.ssl_enabled?("postgresql://user:pass@example.com/local_db", "true")
  end

  test "allows env override to force ssl off" do
    refute DatabaseUrl.ssl_enabled?(
             "postgresql://user:pass@example.com/neondb?sslmode=require",
             "false"
           )
  end
end
