defmodule PlatformPhx.Ethereum.CastAdapterTest do
  use ExUnit.Case, async: false

  alias PlatformPhx.Ethereum.CastAdapter

  setup do
    original_path = System.get_env("PATH")

    on_exit(fn ->
      if original_path do
        System.put_env("PATH", original_path)
      else
        System.delete_env("PATH")
      end
    end)

    :ok
  end

  test "returns a readable error when cast is unavailable" do
    System.put_env("PATH", "")

    assert {:error, "cast executable not found on the server"} =
             CastAdapter.namehash("regent.eth")
  end
end
