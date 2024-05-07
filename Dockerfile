FROM alpine:latest

RUN apk update \
&& apk upgrade \
&& apk add git curl \
&& curl -Lo gh.tar.gz https://github.com/cli/cli/releases/download/v2.49.0/gh_2.49.0_linux_amd64.tar.gz \
&& tar -xzf gh.tar.gz \
&& mv gh*/bin/gh /usr/local/bin/gh

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
