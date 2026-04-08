defmodule PlatformPhx.Repo.Migrations.AlignPlatformAgentsWithCurrentFoundryShape do
  use Ecto.Migration

  def up do
    execute("""
    ALTER TABLE platform_agents
      ADD COLUMN IF NOT EXISTS sprite_name varchar(255),
      ADD COLUMN IF NOT EXISTS sprite_url varchar(255),
      ADD COLUMN IF NOT EXISTS paperclip_url varchar(255),
      ADD COLUMN IF NOT EXISTS paperclip_company_id varchar(255),
      ADD COLUMN IF NOT EXISTS paperclip_agent_id varchar(255),
      ADD COLUMN IF NOT EXISTS runtime_status varchar(255) DEFAULT 'ready',
      ADD COLUMN IF NOT EXISTS checkpoint_status varchar(255) DEFAULT 'ready'
    """)

    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'platform_agents'
          AND column_name = 'runtime_host'
      ) THEN
        EXECUTE $sql$
          UPDATE platform_agents
          SET sprite_name = COALESCE(sprite_name, slug || '-sprite'),
              sprite_url = COALESCE(sprite_url, runtime_host, 'https://' || slug || '.sprites.dev'),
              paperclip_url = COALESCE(paperclip_url, runtime_host, 'https://' || slug || '.sprites.dev'),
              paperclip_company_id = COALESCE(paperclip_company_id, slug || '-company'),
              paperclip_agent_id = COALESCE(paperclip_agent_id, slug || '-hermes'),
              runtime_status = COALESCE(runtime_status, 'ready'),
              checkpoint_status = COALESCE(checkpoint_status, 'ready')
        $sql$;
      ELSE
        EXECUTE $sql$
          UPDATE platform_agents
          SET sprite_name = COALESCE(sprite_name, slug || '-sprite'),
              sprite_url = COALESCE(sprite_url, 'https://' || slug || '.sprites.dev'),
              paperclip_url = COALESCE(paperclip_url, 'https://' || slug || '.sprites.dev'),
              paperclip_company_id = COALESCE(paperclip_company_id, slug || '-company'),
              paperclip_agent_id = COALESCE(paperclip_agent_id, slug || '-hermes'),
              runtime_status = COALESCE(runtime_status, 'ready'),
              checkpoint_status = COALESCE(checkpoint_status, 'ready')
        $sql$;
      END IF;
    END
    $$;
    """)

    execute("""
    ALTER TABLE platform_agents
      ALTER COLUMN runtime_status SET DEFAULT 'ready',
      ALTER COLUMN runtime_status SET NOT NULL,
      ALTER COLUMN checkpoint_status SET DEFAULT 'ready',
      ALTER COLUMN checkpoint_status SET NOT NULL
    """)

    create_if_not_exists index(:platform_agents, [:runtime_status])

    execute("""
    ALTER TABLE platform_agents
      DROP COLUMN IF EXISTS runtime_host
    """)
  end

  def down do
    execute("""
    ALTER TABLE platform_agents
      ADD COLUMN IF NOT EXISTS runtime_host varchar(255)
    """)

    execute("""
    UPDATE platform_agents
    SET runtime_host = COALESCE(runtime_host, sprite_url, paperclip_url, 'https://' || slug || '.sprites.dev')
    """)

    drop_if_exists index(:platform_agents, [:runtime_status])

    execute("""
    ALTER TABLE platform_agents
      DROP COLUMN IF EXISTS checkpoint_status,
      DROP COLUMN IF EXISTS runtime_status,
      DROP COLUMN IF EXISTS paperclip_agent_id,
      DROP COLUMN IF EXISTS paperclip_company_id,
      DROP COLUMN IF EXISTS paperclip_url,
      DROP COLUMN IF EXISTS sprite_url,
      DROP COLUMN IF EXISTS sprite_name
    """)
  end
end
