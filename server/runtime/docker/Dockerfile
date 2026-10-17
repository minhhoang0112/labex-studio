FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash sudo python3 openssl passwd util-linux procps psmisc coreutils findutils \
    grep sed gawk diffutils file tar gzip bzip2 xz-utils unzip zip \
    cron iproute2 net-tools iputils-ping ufw iptables curl wget ca-certificates \
    nano vim-tiny less man-db figlet libtext-charwidth-perl && \
    apt-mark auto libtext-charwidth-perl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --gid 1000 labex && \
    useradd --uid 1000 --gid 1000 --groups sudo --create-home --shell /bin/bash labex && \
    mkdir -p /home/labex/project /var/log/labex /opt/labex && \
    chown -R labex:labex /home/labex && \
    printf 'Defaults !lecture\n%%sudo ALL=(ALL:ALL) ALL\nlabex ALL=(ALL:ALL) NOPASSWD: ALL\n' > /etc/sudoers.d/labex && \
    chmod 0440 /etc/sudoers.d/labex && \
    printf 'GROUP=100\nHOME=/home\nINACTIVE=-1\nEXPIRE=\nSHELL=/bin/sh\nSKEL=/etc/skel\nCREATE_MAIL_SPOOL=no\n' > /etc/default/useradd && \
    sed -i '/^CREATE_HOME /d' /etc/login.defs && printf '\nCREATE_HOME no\n' >> /etc/login.defs
COPY server/pty/linux_runner.py /opt/labex/linux_runner.py
COPY server/runtime/docker/containerbootstrap.py /opt/labex/containerbootstrap.py
ENV HOME=/home/labex USER=labex LOGNAME=labex SHELL=/bin/bash TERM=xterm-256color LC_ALL=C.UTF-8
WORKDIR /home/labex/project
ENTRYPOINT ["/usr/bin/python3", "/opt/labex/containerbootstrap.py", "serve"]
