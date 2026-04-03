ARG ELIXIR_VERSION=1.19.5
ARG OTP_VERSION=28

FROM elixir:${ELIXIR_VERSION}-otp-${OTP_VERSION} AS build

ENV DEBIAN_FRONTEND=noninteractive
ENV FOUNDRY_DIR=/opt/foundry

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends build-essential git curl ca-certificates nodejs npm && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV MIX_ENV=prod

RUN mix local.hex --force && mix local.rebar --force
RUN curl -L https://foundry.paradigm.xyz | bash && \
    "${FOUNDRY_DIR}/bin/foundryup" && \
    cp "${FOUNDRY_DIR}/bin/cast" /usr/local/bin/cast

COPY mix.exs mix.lock ./
COPY config config
COPY lib lib
COPY priv priv
COPY rel rel
COPY assets assets

RUN mix deps.get --only prod
RUN mix deps.compile
RUN npm --prefix assets install
RUN mix assets.deploy
RUN mix compile
RUN mix release

FROM debian:trixie-slim AS app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends libstdc++6 openssl libncurses6 locales ca-certificates && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen && \
    rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8
ENV HOME=/app

WORKDIR /app

COPY --from=build /usr/local/bin/cast /usr/local/bin/cast
COPY --from=build /app/_build/prod/rel/platform_phx ./

EXPOSE 4000

CMD ["/app/bin/server"]
