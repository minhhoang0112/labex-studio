FROM labex-local/ubuntu22:1
RUN sed -i '\|^path-exclude=/usr/share/man/|d' /etc/dpkg/dpkg.cfg.d/excludes && \
    rm -f /usr/bin/man && dpkg-divert --quiet --remove --rename /usr/bin/man && \
    apt-get update && apt-get install -y --no-install-recommends \
    ncal zsh openssh-client openssh-server fdisk e2fsprogs bsdextrautils manpages manpages-dev && \
    apt-get install -y --reinstall --no-install-recommends man-db coreutils passwd && \
    mandb -q && rm -rf /var/lib/apt/lists/*
