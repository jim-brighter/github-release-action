FROM alpine:latest

RUN apk update \
&& apk upgrade \
&& apk add git curl jq

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
