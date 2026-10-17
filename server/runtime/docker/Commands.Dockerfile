FROM labex-local/ubuntu22:1
ENV DEBIAN_FRONTEND=noninteractive
RUN for config in /etc/dpkg/dpkg.cfg.d/*; do \
        if [ -f "$config" ]; then sed -i '\@^path-exclude=/usr/share/man@d' "$config"; fi; \
    done && \
    apt-get update && apt-get install -y --no-install-recommends \
    cowsay tree gcc python-is-python3 openssh-client manpages manpages-dev && \
    rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends libc6-dev && \
    rm -rf /var/lib/apt/lists/*
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games
